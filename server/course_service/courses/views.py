import cloudinary.uploader
import jwt
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import DatabaseError

from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied

from .models import (
    Category, Course, LearningObjective, CourseRequirement, Section, SectionItem, Purchase, 
    SectionItemCompletion, Assessment, Review
)

from .serializers import (
    CategorySerializer, CategorySerializerUser, CourseSerializer, LearningObjectiveSerializer, 
    CourseRequirementSerializer, CourseObjectivesRequirementsSerializer, SectionSerializer,
    SectionItemSerializer, SectionItemDetailSerializer, SectionDetailSerializer, CourseDetailSerializer,
    CourseUnAuthDetailSerializer, PurchaseCreateSerializer, StudentMyCourseSerializer, StudentMyCourseDetailSerializer,
    ReviewCreateSerializer, ReviewSerializer
)
from .permissions import IsAdminUserCustom, IsProfileCompleted, IsUser, IsUserTutor
from .services import CallUserService, UserServiceException

call_user_service = CallUserService()

# Custom pagination class to handle pagination in API responses
class CustomPagination(PageNumberPagination):
    page_size = 9  # The default page size
    page_size_query_param = 'page_size'  # Allow users to override page size(default is 9)
    max_page_size = 100  # Maximum page size allowed

    def get_paginated_response(self, data):
        # Get the next and previous page numbers
        next_page = self.get_next_link()
        previous_page = self.get_previous_link()

        # Extract just the query parameters
        next_parts = next_page.split('?') if isinstance(next_page, str) else next_page
        previous_parts = previous_page.split('?') if isinstance(previous_page, str) else previous_page

        next_params = next_page if not isinstance(next_page, str) else next_parts[1] if len(next_parts) > 1 else ''
        previous_params = previous_page if not isinstance(previous_page, str) else previous_parts[1] if len(previous_parts) > 1 else ''

        return Response({
            'count': self.page.paginator.count,
            'next': next_params,
            'previous': previous_params,
            'results': data
        })

# Create, update, and list categories for admin
class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUserCustom]
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    pagination_class = CustomPagination
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ['title']  # Specify which fields can be searched
    ordering_fields = ['created_at', 'title']  # Specify which fields can be used for sorting
    ordering = ['-created_at']  # Default ordering by most recently added item

# List all categories for user
class UserCategoryView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            categories = Category.objects.all().order_by('-created_at')
            print(categories.values())
            serializer = CategorySerializerUser(categories, many=True)
            print(serializer)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response({'detail': 'Categories not found'}, status=status.HTTP_404_NOT_FOUND)

# Create a Course for user, List all courses for all, update a course for tutor
class CourseCreateAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # to handle file uploads, because this view contain multipart data
    pagination_class = CustomPagination
    def get_permissions(self):
        # Allow GET for everyone, require IsProfileCompleted for POST, PATCH, etc
        if self.request.method == 'GET':
            return []
        return [IsProfileCompleted()]
    
    def get_object(self, course_id, user_id):
        try:
            course = Course.objects.get(id=course_id, instructor=user_id)
            return course
        except Course.DoesNotExist:
            raise Http404

    def get(self, request, *args, **kwargs):
        courses = Course.objects.filter(is_complete=True, is_available=True)

        # Search functionality
        search_query = request.query_params.get('search', None)
        if search_query:
            print('inside search')
            courses = courses.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Filter by category
        category = request.query_params.get('category', None)
        if category:
            courses = courses.filter(category=category)

        instructor = request.query_params.get('tutor', None)
        if instructor:
            print('instructor:', instructor)
            courses = courses.filter(instructor=instructor)

        # Sorting functionality
        sort_by = request.query_params.get('sort_by', None)
        if sort_by:
            valid_sorts = {
                'amount': 'subscription_amount',
                '-amount': '-subscription_amount',
                'recent': 'created_at',
                '-recent': '-created_at',
                # 'popular': '-popularity',  # Assuming popularity is based on enrollments
            }
            if sort_by in valid_sorts:
                # For popularity, we need to annotate first
                if 'popular' in sort_by:
                    courses = courses.annotate(popularity=Count('enrollments'))  # Adjust 'enrollments' to your actual related field
                courses = courses.order_by(valid_sorts[sort_by])
            else:
                return Response({'detail': f'Invalid sort_by value. Use: {list(valid_sorts.keys())}'}, 
                              status=status.HTTP_400_BAD_REQUEST)

        # Pagination
        paginator = self.pagination_class()
        try:
            page = paginator.paginate_queryset(courses, request)
            serializer = CourseSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            return Response({'detail': f'Error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request, *args, **kwargs):
        print('here in the post')
        user_id = request.user_payload['user_id']
        print('CourseCreate post request:', request.data)
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            thumbnail_file = serializer.validated_data.pop('thumbnail_file', None)

            if thumbnail_file:
                upload_result = cloudinary.uploader.upload(
                    thumbnail_file,
                    folder="Course/Thumbnail/"
                )
                thumbnail_url = upload_result.get('secure_url')
            else:
                return Response({'detail': 'Thumbnail is required'}, status=status.HTTP_400_BAD_REQUEST)

            course = Course.objects.create(
                **serializer.validated_data,
                instructor=user_id,
                thumbnail=thumbnail_url,
                step=2,
            )
            serializer = CourseSerializer(course)
            serializer_data = serializer.data
            serializer_data['thumbnail'] = thumbnail_url
            print(serializer_data)
            return Response(serializer_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs): 
        print('here in the patch')
        user_id = request.user_payload['user_id']
        course_id = request.data.get('id')

        try:
            if not course_id:
                return Response({'detail': 'Course ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            course = self.get_object(course_id, user_id)
            
            serializer = CourseSerializer(course, data=request.data, partial=True)
            
            if serializer.is_valid():
                thumbnail_file = serializer.validated_data.pop('thumbnail_file', None)
                thumbnail_url = None
                
                if thumbnail_file:
                    try:
                        # Delete old thumbnail if it exists
                        if course.thumbnail:
                            public_id = "Course/Thumbnail/" + course.thumbnail.split('/')[-1].split('.')[0]
                            cloudinary.uploader.destroy(public_id)
                        
                        # Upload new thumbnail
                        upload_result = cloudinary.uploader.upload(
                            thumbnail_file,
                            folder="Course/Thumbnail/"
                        )
                        thumbnail_url = upload_result.get('secure_url')
                        serializer.validated_data['thumbnail'] = thumbnail_url
                    except Exception as e:
                        return Response(
                            {'detail': f'Error handling thumbnail: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                
                # Save the serializer
                serializer.save()
                serializer_data = serializer.data
                
                if thumbnail_url is not None:
                    serializer_data['thumbnail'] = thumbnail_url
                    
                print(serializer_data)
                return Response(serializer_data, status=status.HTTP_200_OK)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Http404:
            return Response(
                {'detail': 'Course not found or you do not have permission to modify it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'An unexpected error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# List uploaded courses of a tutor
class TutorCourseListAPIView(APIView):
    permission_classes = [IsUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # to handle file uploads

    def get(self, request, *args, **kwargs):
        user_id = request.user_payload['user_id']
        courses = Course.objects.filter(instructor=user_id, is_complete=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# List Un-Complete courses of a tutor
class ListDraftsView(APIView):
    permission_classes = [IsUser]
    def get(self, request):
        user_id = request.user_payload['user_id']
        courses = Course.objects.filter(instructor=user_id, is_complete=False)
        print(courses)
        serializer = CourseSerializer(courses, many=True)
        serializer_data = serializer.data
        print('serializer_data:', serializer_data)
        # serializer_data['thumbnail'] = thumbnail_url
        return Response(serializer.data, status=status.HTTP_200_OK)

# Delete Un-Completed(draft) course of a tutor
class DeleteDraftView(APIView):
    permission_classes = [IsUser]

    def delete(self, request, course_id):
        user_id = request.user_payload['user_id']
        try:
            course = Course.objects.get(id=course_id, instructor=user_id, is_complete=False)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found or not a draft'}, status=status.HTTP_404_NOT_FOUND)

        # Delete the course
        course.delete()
        print('course deleted')
        return Response({'detail': 'Draft deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# Create Objectives and Requirements
class CreateObjectivesRequirementsView(APIView):
    permission_classes = [IsUser]
    
    def post(self, request):
        serializer = CourseObjectivesRequirementsSerializer(data=request.data)
        if serializer.is_valid():
            print('serializer:', serializer)
            try:
                course_id = request.data.get('course_id')
                print('coursid:', course_id)

                course = Course.objects.get(id=course_id)
                print('cours:', course)
                # Fetch all objectives and requirements for the course
                objectives = course.objectives.all()
                requirements = course.requirements.all()
                print(objectives.values_list)
                print(requirements.values_list)
            except Course.DoesNotExist:
                return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer.save()
            # Serialize the full sets of objectives and requirements
            objectives_data = LearningObjectiveSerializer(objectives, many=True).data
            requirements_data = CourseRequirementSerializer(requirements, many=True).data

            # Check the length of objectives_data and requirements_data before changing step
            if len(objectives_data) >= 1 and len(requirements_data) >= 1 and course.step < 3:
                course.step = 3
                course.save()

            response_data = {
                'objectives': objectives_data,
                'requirements': requirements_data
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Fetch Objectives
class ObjectiveListView(generics.ListAPIView):
    serializer_class = LearningObjectiveSerializer

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return LearningObjective.objects.filter(course_id=course_id).only('id', 'objective')

# Fetch Requirements
class RequirementListView(generics.ListAPIView):
    serializer_class = CourseRequirementSerializer

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return CourseRequirement.objects.filter(course_id=course_id).only('id', 'requirement')

# Update Objective (PATCH)
class ObjectiveUpdateView(generics.UpdateAPIView):
    queryset = LearningObjective.objects.all()
    serializer_class = LearningObjectiveSerializer
    lookup_field = 'id'
    permission_classes = [IsUser]

    def patch(self, request, *args, **kwargs):
        objective = self.get_object()

        # Checking requesting user and course instructor are same
        user_id = request.user_payload['user_id']
        if objective.course.instructor != user_id:
            raise PermissionDenied("You can only update objectives for courses you created.")
        
        self.partial_update(request, *args, **kwargs)
        all_objectives = LearningObjective.objects.filter(course=objective.course)
        serializer = LearningObjectiveSerializer(all_objectives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Update Requirement (PATCH)
class RequirementUpdateView(generics.UpdateAPIView):
    queryset = CourseRequirement.objects.all()
    serializer_class = CourseRequirementSerializer
    lookup_field = 'id'
    permission_classes = [IsUser]

    def patch(self, request, *args, **kwargs):
        requirement = self.get_object()

        # Checking requesting user and course instructor are same
        user_id = request.user_payload['user_id']
        if requirement.course.instructor != user_id:
            raise PermissionDenied("You can only update requirements for courses you created.")
        
        self.partial_update(request, *args, **kwargs)
        all_requirements = CourseRequirement.objects.filter(course=requirement.course)
        serializer = CourseRequirementSerializer(all_requirements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Delete Objective
class ObjectiveDeleteView(generics.DestroyAPIView):
    queryset = LearningObjective.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        objective = self.get_object()

        # Checking requesting user and course instructor are same
        user_id = request.user_payload['user_id']
        if objective.course.instructor != user_id:
            raise PermissionDenied("You can only update objectives for courses you created.")

        course = objective.course
        remaining_objectives = LearningObjective.objects.filter(course=course)
        if course.is_complete and remaining_objectives.count() <= 1:
            return Response({'detail': 'At least one Objective must remain for the course'}, status=status.HTTP_400_BAD_REQUEST)
        self.destroy(request, *args, **kwargs)
        serializer = LearningObjectiveSerializer(remaining_objectives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Delete Requirement
class RequirementDeleteView(generics.DestroyAPIView):
    queryset = CourseRequirement.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        requirement = self.get_object()

        # Checking requesting user and course instructor are same
        user_id = request.user_payload['user_id']
        if requirement.course.instructor != user_id:
            raise PermissionDenied("You can only update requirements for courses you created.")

        course = requirement.course
        remaining_requirements = CourseRequirement.objects.filter(course=course)
        # Check if the course is complete
        if course.is_complete and remaining_requirements.count() <= 1:
            return Response({'detail': 'At least one requirement must remain for the course'}, status=status.HTTP_400_BAD_REQUEST)
        self.destroy(request, *args, **kwargs)
        serializer = CourseRequirementSerializer(remaining_requirements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Create New Section
class SectionCreateView(APIView):
    permission_classes = [IsUser]

    def post(self, request, *args, **kwargs):
        user_id = request.user_payload['user_id']
        serializer = SectionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                course_id = request.data.get('course')
                print('coursid:', course_id)
                course = Course.objects.get(id=course_id)
                print('cours:', course)
                # sections = Section.objects.filter(course=course)
                # print(sections.values_list)
            except Course.DoesNotExist:
                return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
            
            print('user_id == course.instructor:', user_id == course.instructor)
            if user_id != course.instructor:
                raise PermissionDenied("You can only create sections for courses you created.")
            serializer.save()
            # sections_data = SectionSerializer(sections, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete Section
class SectionDeleteView(generics.DestroyAPIView):
    queryset = Section.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        section = self.get_object()
        user_id = request.user_payload['user_id']
        if section.course.is_complete:
            return Response(
                {'detail': 'Cannot modify course that is already completed'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user_id != section.course.instructor:
            raise PermissionDenied("You can only delete sections for courses you created.")
        print('user_id == section.course.instructor', user_id == section.course.instructor)
        self.destroy(request, *args, **kwargs)
        remaining_sections = Section.objects.filter(course=section.course)
        serializer = SectionDetailSerializer(remaining_sections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# class SectionItemCreateView(APIView):
#     def post(self, request, *args, **kwargs):
#         serializer = SectionItemSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Create New Section Item
class SectionItemCreateView(generics.CreateAPIView):
    queryset = SectionItem.objects.all()
    serializer_class = SectionItemSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsProfileCompleted]

    def create(self, request, *args, **kwargs):
        user_id = request.user_payload['user_id']
        section_id = request.data.get('section')
        try:
            section = get_object_or_404(Section, id=section_id, course__instructor=user_id)
            print('section item create', section)
        except Section.DoesNotExist:
            return Response({'detail': 'Section not found or you do not have permission to modify it'},
                            status=status.HTTP_404_NOT_FOUND)
        if section.course.is_complete:
            return Response(
                {'detail': 'Cannot modify sections of course that is already completed'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        created_instance = serializer.instance  # The saved SectionItem object
        headers = self.get_success_headers(serializer.data)

        detail_serializer = SectionItemDetailSerializer(created_instance, context=self.get_serializer_context())
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)    

# Delete Section Item
class SectionItemDeleteView(generics.DestroyAPIView):
    queryset = SectionItem.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        section_item = self.get_object()
        if section_item.section.course.is_complete:
            return Response(
                {'detail': 'Cannot modify course that is already completed'},
                status=status.HTTP_403_FORBIDDEN
            )
        self.destroy(request, *args, **kwargs)
        remaining_sectionItems = SectionItem.objects.filter(section=section_item.section)
        serializer = SectionItemDetailSerializer(remaining_sectionItems, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Fetch Section Content
# class SectionContentView(generics.RetrieveAPIView):
#     serializer_class = SectionDetailSerializer
#     # permission_classes = [IsAuthenticated]  # Uncomment if authentication is required

#     def get_object(self):
#         section_id = self.kwargs.get('section_id')
#         section = get_object_or_404(Section, id=section_id)
        
#         # Check course availability and completion
#         course = section.course
#         # if not course.is_available:
#         #     raise serializers.ValidationError("This course is not available")
#         # if not course.is_complete:
#         #     raise serializers.ValidationError("This course is not complete")
            
#         return section

    # def retrieve(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance)
    #     return Response(serializer.data, status=status.HTTP_200_OK)
    
# To fetch entire view of a course - on uploading a new course or updating an existing course
class CourseInCompleteView(generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    permission_classes = [IsProfileCompleted]

    def get_object(self):
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        # # Check course completion
        # if course.is_complete:
        #     raise serializers.ValidationError("This course is already completed")
        return course

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

# activate and deactivate a course - option for tutor
class TutorToggleActivationCourseView(APIView):
    def patch(self, request):
        user_id = request.user_payload['user_id']
        course_id = request.data.get('course_id')

        if not course_id:
            return Response({'detail': 'Course ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id, instructor=user_id)
            course.is_available = not course.is_available
            course.save()
            serializer = CourseDetailSerializer(course)
            print('serializer:', serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
            # return Response({serializer.data}, status=status.HTTP_200_OK)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

# Showing Course details to user who is not enrolled in the course
class CourseUnAuthDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.prefetch_related(
        'objectives',
        'requirements',
        'sections__items__video',
        'sections__items__documents'
    )
    serializer_class = CourseUnAuthDetailSerializer
    lookup_field = 'id'

    def get(self, request, *args, **kwargs):
        print('here in get')
        user_id = request.user_payload['user_id']
        response = super().get(request, *args, **kwargs)
        course = self.get_object()
        print('Course:', course, course.id)

        if not course.is_available or not course.is_complete:
            return Response({'detail': 'This course is not available'}, status=status.HTTP_403_FORBIDDEN)
        
        # # Fetch instructor details from user_service
        # response_user_service = call_user_service.get_user_details(course.instructor)
        # instructor_details = response_user_service.json()
        # print('instructor_details:', instructor_details)
        # # Append instructor details to response
        # response.data['instructor_details'] = instructor_details
        purchase = Purchase.objects.filter(user=user_id, course=course)
        # Check if the user has already purchased the course
        response.data['is_enrolled'] = 'No' if not purchase.exists() else purchase.first().purchase_type

        response.data['purchase_id'] = purchase.first().id if purchase.exists() else None
        # Check if the course is available or complete
        if not course.is_available or not course.is_complete:
            return Response({'detail': 'This course is not available'}, status=status.HTTP_403_FORBIDDEN)
        return response

# Purchase a new course
class CoursePurchaseView(APIView):
    permission_classes = [IsProfileCompleted]
    
    def post(self, request, course_id):
        user_id = request.user_payload['user_id']
        print('user_id:', user_id)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the user has already purchased the course
        if Purchase.objects.filter(user=user_id, course=course).exists():
            return Response({'detail': 'You have already purchased this course'}, status=status.HTTP_400_BAD_REQUEST)
        
        if course.instructor == user_id:
            return Response({'detail': 'You cannot purchase your own course'}, status=status.HTTP_400_BAD_REQUEST)
        
        print('course_id:', course_id)
        print('user_id:', user_id)
        request.data['course'] = course_id
        request.data['user'] = user_id
        serializer = PurchaseCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            print('serializer.data:', serializer.data)
            print('serializer.data:', serializer.data.get('id'))
            return Response({'detail': 'Course purchased successfully', 'purchase_id': serializer.data.get('id')}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# List all courses purchased by a student
class StudentMyCoursesListView(APIView): 
    # permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        print('StudentMyCoursesListView headers:', request.headers)
        print('StudentMyCoursesListView user_payload:', request.user_payload)
        user_id = request.user_payload['user_id']

        if not student_id == user_id:
            return Response({'detail': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get all purchases for the user with related course data
            purchases = Purchase.objects.filter(user=user_id).select_related('course')
            
            # Serialize the data
            serializer = StudentMyCourseSerializer(purchases, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# class CourseAuthDetailView(generics.RetrieveAPIView):
#     queryset = Course.objects.all()
#     serializer_class = StudentMyCourseDetailSerializer
#     lookup_field = 'id'

#     def get(self, request, *args, **kwargs):
#         user_id, error_response = get_user_id_from_token(request)
#         if error_response:
#             return error_response

#         response = super().get(request, *args, **kwargs)
#         course = self.get_object()
#         print('Course:', course, course.id)

#         if not Purchase.objects.filter(user=user_id, course=course).exists():
#             return Response({'detail': 'You are not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)
                    
#         # Fetch instructor details from user_service
#         response_user_service = call_user_service.get_user_details(course.instructor)
#         instructor_details = response_user_service.json()
#         print('instructor_details:', instructor_details)
#         # Append instructor details to response
#         response.data['instructor_details'] = instructor_details
#         purchase = Purchase.objects.filter(user=user_id, course=course)
#         response.data['is_enrolled'] = 'No' if not purchase.exists() else purchase.first().purchase_type
#         return response

# Fetch Enrolled Courses Entire Detials, including tutorials and assessments
class StudentMyCourseDetailView(APIView):
    permission_classes = [IsProfileCompleted]

    def get(self, request, purchase_id):
        try:
            user_id = request.user_payload['user_id']
            purchase = Purchase.objects.get(id=purchase_id, user=user_id)
            serializer = StudentMyCourseDetailSerializer(purchase)
            return Response(serializer.data)
        except Purchase.DoesNotExist:
            return Response({"error": "Course purchase not found"}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
# Mark checked - Submit Assessment Answers of an enrolled course
class StudentAssessmentSubmitView(APIView):
    # permission_classes = [IsAuthenticated]
    def post(self, request, assessment_id):
        try:
            user_id = request.user_payload['user_id']            
            user_answers = request.data.get('answers')
            assement = Assessment.objects.get(id=assessment_id)
            # Check if the user has already purchased the course
            purchase = Purchase.objects.get(course=assement.section_item.section.course, user=user_id)
            questions = assement.questions.all()
            passing_score = assement.passing_score
            correct_answers = 0
            for question in questions:
                user_answer_id = user_answers.get(str(question.id))
                if user_answer_id:
                    correct_answer = question.choices.filter(is_correct=True).first()
                    if int(user_answer_id) == correct_answer.id:
                        correct_answers += 1

            # Update the purchase record to indicate the assessment was passed
            if correct_answers >= (questions.count() * passing_score / 100):
                section_item_completion, created = SectionItemCompletion.objects.get_or_create(
                    purchase=purchase, section_item=assement.section_item
                )
                if created or not section_item_completion.completed:
                    section_item_completion.completed = True
                    section_item_completion.save()
                    serializer = StudentMyCourseDetailSerializer(purchase)
                    return Response({'purchase': serializer.data, 'score': correct_answers}, status=status.HTTP_200_OK)
            return Response({'score':correct_answers}, status=status.HTTP_200_OK)

        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found"}, status=404)
        except Purchase.DoesNotExist:
            return Response({'detail': 'You are not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)

# Mark checked - Submit Lecture Completion of an enrolled course
class StudentLectureSubmitView(APIView):
    # permission_classes = [IsAuthenticated]
    def post(self, request, lecture_id):
        try:
            user_id = request.user_payload['user_id']
            section_item = SectionItem.objects.get(id=lecture_id)
            # Check if the user has already purchased the course
            purchase = Purchase.objects.get(course=section_item.section.course, user=user_id)

            section_item_completion, created = SectionItemCompletion.objects.get_or_create(
                purchase=purchase, section_item=section_item
            )
            if created or not section_item_completion.completed:
                section_item_completion.completed = True
                section_item_completion.save()
                serializer = StudentMyCourseDetailSerializer(purchase)
                return Response({'purchase': serializer.data}, status=status.HTTP_200_OK)
            return Response({'details':"section item is already completed"}, status=status.HTTP_400_BAD_REQUEST)

        except SectionItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)
        except Purchase.DoesNotExist:
            return Response({'detail': 'You are not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# class EvaluateQuizView(APIView):
#     permission_classes = [AllowAny]
#     def post(self, request):
#         badge_id = request.data.get('badge_id')
#         user_answers = request.data.get('answers') 
#         print('here evaluadt______________=====')
#         try:
#             badge = Badges.objects.get(id=badge_id)
#             questions = Questions.objects.filter(badge_id=badge_id)
#             total_questions = badge.total_questions
#             pass_mark = badge.pass_mark

#             # Calculate score
#             correct_answers = 0
#             for question in questions:
#                 user_answer_id = user_answers.get(str(question.id))
#                 if user_answer_id:
#                     correct_answer = Answers.objects.get(
#                         question_id=question.id, 
#                         is_correct=True
#                     )
#                     if int(user_answer_id) == correct_answer.id:
#                         correct_answers += 1
#             print('came up here1')
#             serializer = BadgeSerializer(badge)
#             print('came up here')
#             print(serializer.data['image_url'])
#             # Prepare response
#             result = {
#                 'image': serializer.data['image_url'],
#                 'title': serializer.data['title'],
#                 'badge_id': badge_id,
#                 'total_questions': total_questions,
#                 'pass_mark': pass_mark,
#                 'acquired_mark': correct_answers,
#                 'is_passed': correct_answers >= pass_mark
#             }
#             print('result:', result)
#             return Response(result, status=status.HTTP_200_OK)

#         except Badges.DoesNotExist:
#             return Response(
#                 {"error": "Badge not found"}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response(
#                 {"error": str(e)}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )

# List Tutors with pagination and filter for the student
class StudentFetchTopTutorsView(APIView):
    pagination_class = CustomPagination
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Fetch top tutors based on course enrollments or ratings
            tutors = Course.objects.values('instructor').annotate(
                total_courses=Count('id'),
                total_enrollments=Count('purchases')
            ).order_by('-total_enrollments')
            print('tutors:', tutors)
            # If no tutors found, return a message
            if not tutors:
                return Response({"message": "No tutors found."}, status=404)

            paginator = self.pagination_class()
            paginated_tutors = paginator.paginate_queryset(tutors, request)

            # Fetch tutor details from user service using the IDs
            tutor_ids = [tutor['instructor'] for tutor in paginated_tutors]
            try:
                response_user_service = call_user_service.get_users_details(tutor_ids)
            except UserServiceException as e:
                # Handle user service exceptions and return appropriate error
                return Response({"error": str(e)}, status=503)
            except Exception as e:
                # Catch any unexpected exceptions
                return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

            tutors_data = response_user_service.json()

            # Validate that the number of tutor details matches the number of tutors
            if len(tutors_data) != len(paginated_tutors):
                return Response(
                    {"error": "Mismatch between number of tutors and tutor details returned."},
                    status=500
                )

            result = []
            for tutor, details in zip(paginated_tutors, tutors_data):
                result.append({
                    'tutor_id': tutor['instructor'],
                    'course_count': tutor['total_courses'],
                    'enrollment_count': tutor['total_enrollments'],
                    'tutor_details': details
                })

            print('result:', result)
            return paginator.get_paginated_response(result)

        except DatabaseError as db_error:
            return Response({"error": f"Database error: {str(db_error)}"}, status=500)

        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

# Total courses and enrollments of a tutor - called from user_service
class StudentTutorAnalysisView(APIView):
    def get(self, request, id):
        try:
            # Count the number of courses uploaded by the tutor
            stats = Course.objects.filter(instructor=id).aggregate(
                total_courses=Count('id'),
                total_enrollments=Count('purchases')
            )
            # Return a response with total courses and total enrollments
            return Response({
                'total_courses': stats['total_courses'],
                'total_enrollments': stats['total_enrollments']
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Tutor can see the preview of the course and students enrolled in it
class TutorCoursePreviewView(APIView):
    permission_classes = [IsProfileCompleted]
    def get(self, request, course_id):
        try:
            print('here in preview')
            user_id = request.user_payload['user_id']
            course = Course.objects.get(id=course_id, instructor=user_id)

            if not course.is_complete:
                return Response({"error": "Course is not completed"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = CourseUnAuthDetailSerializer(course)
            data = {
                'course': serializer.data,
            }
            students = Purchase.objects.filter(course=course).values('user')
            print('students:', students)
            student_ids = [student['user'] for student in students]
            print('student_ids:', student_ids)
            # Fetch student details from user service using the IDs
            students_data = []
            try:
                if student_ids:
                    response_user_service = call_user_service.get_users_details(student_ids)
                    students_data = response_user_service.json()
            except UserServiceException as e:
                # Handle user service exceptions and return appropriate error
                return Response({"error": str(e)}, status=503)
            
            print('students_data:', students_data)
            data['students'] = students_data
            return Response(data, status=status.HTTP_200_OK)

        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            # Catch any unexpected exceptions
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

# Create a new review for a course
class ReviewListCreateAPIView(APIView):
    permission_classes = [IsProfileCompleted]

    # def get(self, request, course_id):
    #     print('here in Reviews')
    #     try:
    #         course = Course.objects.get(id=course_id)
    #         reviews = Review.objects.filter(course=course)
    #         serializer = ReviewSerializer(reviews, many=True)
    #         return Response(serializer.data)
    #     except Course.DoesNotExist:
    #         return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, course_id):
        print('here in Reviews')
        try:
            user_id = request.user_payload['user_id']
            course = Course.objects.get(id=course_id)
            
            if not Purchase.objects.filter(user=user_id, course=course).exists():
                return Response({"error": "You must purchase the course to review it"}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user already reviewed this course
            if Review.objects.filter(user=user_id, course=course).exists():
                return Response({"error": "You have already reviewed this course"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ReviewCreateSerializer( data=request.data, context={'request': request} )
            
            if serializer.is_valid():
                serializer.save( user=user_id, course=course )
                return Response( serializer.data, status=status.HTTP_201_CREATED )
            return Response( serializer.errors, status=status.HTTP_400_BAD_REQUEST )
            
        except Course.DoesNotExist:
            return Response( {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND )
        

# class CourseReviewsView(generics.ListAPIView):
#     serializer_class = ReviewSerializer

#     def get_queryset(self):
#         course_id = self.kwargs.get('course_id')
#         print()
#         return Review.objects.filter(course__id=course_id).order_by('-created_at')

# Fetch Reviews of a course for a student, incuding own review
class StudentCourseReviewsView(APIView):
    permission_classes = [IsUser]

    def get(self, request, course_id):
        print('here in Reviews for student')
        try:
            user_id = request.user_payload['user_id']
            course = Course.objects.get(id=course_id)
            if not Purchase.objects.filter(user=user_id, course=course).exists():
                return Response({"error": "You must purchase the course to get the details"}, status=status.HTTP_403_FORBIDDEN)
            my_review = Review.objects.filter(course=course, user=user_id).first()
            if my_review:
                my_review_serializer = ReviewSerializer(my_review)
            reviews = Review.objects.filter(course=course).exclude(user=user_id)[:4]
            serializer = ReviewSerializer(reviews, many=True)
            data = {
                'my_review': my_review_serializer.data if my_review else None,
                'reviews': serializer.data
            }
            return Response(data, status=status.HTTP_200_OK)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        except Review.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
# Fetch all courses uploaded by a tutor and enrolled by a student - for admin
class AdminUserCoursesDetailsView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, user_id):
        try:
            purchases = Purchase.objects.filter(user=user_id).select_related('course')
            enrolled_courses = [purchase.course for purchase in purchases]
            enrolled_courses_serializer = CourseSerializer(enrolled_courses, many=True)
            uploaded_courses = Course.objects.filter(instructor=user_id, is_complete=True)
            uploaded_courses_serializer = CourseSerializer(uploaded_courses, many=True)
            data = {
                'enrolled_courses': enrolled_courses_serializer.data,
                'uploaded_courses': uploaded_courses_serializer.data
            }
            return Response(data, status=status.HTTP_200_OK)
        except Purchase.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
