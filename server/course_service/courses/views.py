import cloudinary.uploader
import jwt
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import serializers

from .models import Category, Course, LearningObjective, CourseRequirement, Section, SectionItem
from .serializers import (
    CategorySerializer, CategorySerializerUser, CourseSerializer, LearningObjectiveSerializer, 
    CourseRequirementSerializer, CourseObjectivesRequirementsSerializer, SectionSerializer,
    SectionItemSerializer, SectionItemDetailSerializer, SectionDetailSerializer, CourseDetailSerializer
)
from .permissions import IsAdminUserCustom


class CustomPagination(PageNumberPagination):
    page_size = 1  # The default page size
    page_size_query_param = 'page_size'  # Allow users to override page size
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

class CourseCreateAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # to handle file uploads

    def get_object(self, course_id, user_id):
        try:
            course = Course.objects.get(id=course_id, instructor=user_id)
            return course
        except Course.DoesNotExist:
            raise Http404

    def get_user_id_from_token(self, request):
        try:
            access_token = request.headers.get('Authorization', '').split(' ')[1]
            payload = jwt.decode(access_token, options={"verify_signature": False})
            user_id = payload.get('user_id')
            if not user_id:
                return None, Response({'detail': 'User ID not found in token'}, status=status.HTTP_401_UNAUTHORIZED)
            return user_id, None
        except Exception as e:
            return None, Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    def get(self, request, *args, **kwargs):
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

        courses = Course.objects.filter(is_complete=True, is_available=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        print('here in the post')
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

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
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

        course_id = request.data.get('id')
        if not course_id:
            return Response({'detail': 'Course ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        course = self.get_object(course_id, user_id)
        
        if course.is_complete:
            return Response(
                {'detail': 'Cannot modify course that is already completed'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            thumbnail_file = serializer.validated_data.pop('thumbnail_file', None)
            thumbnail_url = None
            if thumbnail_file:
                # Delete old thumbnail if it exists
                if course.thumbnail:
                    # Extract public_id from URL # best way is to store public id in the model or create unique public id and overwrite.
                    public_id = "Course/Thumbnail/" + course.thumbnail.split('/')[-1].split('.')[0] 
                    cloudinary.uploader.destroy(public_id)
                
                # Upload new thumbnail
                upload_result = cloudinary.uploader.upload(
                    thumbnail_file,
                    folder="Course/Thumbnail/"
                )
                thumbnail_url = upload_result.get('secure_url')
                serializer.validated_data['thumbnail'] = thumbnail_url
            serializer.save()
            serializer_data = serializer.data
            if thumbnail_url is not None:
                serializer_data['thumbnail'] = thumbnail_url
            print(serializer_data)
            return Response(serializer_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# List uploaded courses of a tutor
class TutorCourseListAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # to handle file uploads

    def get_user_id_from_token(self, request):
        try:
            access_token = request.headers.get('Authorization', '').split(' ')[1]
            payload = jwt.decode(access_token, options={"verify_signature": False})
            user_id = payload.get('user_id')
            if not user_id:
                return None, Response({'detail': 'User ID not found in token'}, status=status.HTTP_401_UNAUTHORIZED)
            return user_id, None
        except Exception as e:
            return None, Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    def get(self, request, *args, **kwargs):
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

        courses = Course.objects.filter(instructor=user_id, is_complete=True, is_available=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# List Un-Complete courses of a tutor
class ListDraftsView(APIView):
    def get_user_id_from_token(self, request):
        try:
            access_token = request.headers.get('Authorization', '').split(' ')[1]
            payload = jwt.decode(access_token, options={"verify_signature": False})
            user_id = payload.get('user_id')
            if not user_id:
                return None, Response({'detail': 'User ID not found in token'}, status=status.HTTP_401_UNAUTHORIZED)
            return user_id, None
        except Exception as e:
            return None, Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    def get(self, request):
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

        courses = Course.objects.filter(instructor=user_id, is_complete=False)
        print(courses)
        serializer = CourseSerializer(courses, many=True)
        serializer_data = serializer.data
        print('serializer_data:', serializer_data)
        # serializer_data['thumbnail'] = thumbnail_url
        return Response(serializer.data, status=status.HTTP_200_OK)

# Delete Un-Completed course of a tutor
class DeleteDraftView(APIView):
    def get_user_id_from_token(self, request):
        try:
            access_token = request.headers.get('Authorization', '').split(' ')[1]
            payload = jwt.decode(access_token, options={"verify_signature": False})
            user_id = payload.get('user_id')
            if not user_id:
                return None, Response({'detail': 'User ID not found in token'}, status=status.HTTP_401_UNAUTHORIZED)
            return user_id, None
        except Exception as e:
            return None, Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    def delete(self, request, course_id):
        user_id, error_response = self.get_user_id_from_token(request)
        if error_response:
            return error_response

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
    permission_classes = [AllowAny]
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

    def patch(self, request, *args, **kwargs):
        objective = self.get_object()
        self.partial_update(request, *args, **kwargs)
        all_objectives = LearningObjective.objects.filter(course=objective.course)
        serializer = LearningObjectiveSerializer(all_objectives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Update Requirement (PATCH)
class RequirementUpdateView(generics.UpdateAPIView):
    queryset = CourseRequirement.objects.all()
    serializer_class = CourseRequirementSerializer
    lookup_field = 'id'

    def patch(self, request, *args, **kwargs):
        requirement = self.get_object()
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
        self.destroy(request, *args, **kwargs)
        remaining_objectives = LearningObjective.objects.filter(course=objective.course)
        serializer = LearningObjectiveSerializer(remaining_objectives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Delete Requirement
class RequirementDeleteView(generics.DestroyAPIView):
    queryset = CourseRequirement.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        requirement = self.get_object()
        self.destroy(request, *args, **kwargs)
        remaining_requirements = CourseRequirement.objects.filter(course=requirement.course)
        serializer = CourseRequirementSerializer(remaining_requirements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Create Section
class SectionCreateView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SectionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                course_id = request.data.get('course')
                print('coursid:', course_id)

                course = Course.objects.get(id=course_id)
                print('cours:', course)
                # Fetch all objectives and requirements for the course
                sections = Section.objects.filter(course=course)
                print(sections.values_list)
            except Course.DoesNotExist:
                return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

            serializer.save()
            # sections_data = SectionSerializer(sections, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SectionDeleteView(generics.DestroyAPIView):
    queryset = Section.objects.all()
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        section = self.get_object()
        if section.course.is_complete:
            return Response(
                {'detail': 'Cannot modify course that is already completed'},
                status=status.HTTP_403_FORBIDDEN
            )
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

class SectionItemCreateView(generics.CreateAPIView):
    queryset = SectionItem.objects.all()
    serializer_class = SectionItemSerializer
    parser_classes = (MultiPartParser, FormParser)
    # permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        created_instance = serializer.instance  # The saved SectionItem object
        headers = self.get_success_headers(serializer.data)

        detail_serializer = SectionItemDetailSerializer(created_instance, context=self.get_serializer_context())
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)    

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

class SectionContentView(generics.RetrieveAPIView):
    serializer_class = SectionDetailSerializer
    # permission_classes = [IsAuthenticated]  # Uncomment if authentication is required

    def get_object(self):
        section_id = self.kwargs.get('section_id')
        section = get_object_or_404(Section, id=section_id)
        
        # Check course availability and completion
        course = section.course
        # if not course.is_available:
        #     raise serializers.ValidationError("This course is not available")
        # if not course.is_complete:
        #     raise serializers.ValidationError("This course is not complete")
            
        return section

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CourseInCompleteView(generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    # permission_classes = [IsAuthenticated]  # Uncomment if authentication is required

    def get_object(self):
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        
        # Check course completion
        if course.is_complete:
            raise serializers.ValidationError("This course is already completed")
            
        return course

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
