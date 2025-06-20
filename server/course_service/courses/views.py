import logging
import cloudinary.uploader
import json
import os
import uuid

# import jwt
# import pytz
import stripe
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import DatabaseError
from django.conf import settings
from django.db import connection, IntegrityError
# from dateutil import parser
# from datetime import datetime, timedelta

from rest_framework import viewsets, generics, status # filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
# from rest_framework.decorators import action
from django.utils import timezone

from .models import (
    Category, Course, LearningObjective, CourseRequirement, Section, SectionItem, Purchase, 
    SectionItemCompletion, Assessment, Review, Report, VideoUpload, VideoSession
)

from .serializers import (
    CategorySerializer, CategorySerializerUser, CourseSerializer, LearningObjectiveSerializer, 
    CourseRequirementSerializer, CourseObjectivesRequirementsSerializer, SectionSerializer,
    SectionItemSerializer, SectionItemDetailSerializer, SectionDetailSerializer, CourseDetailSerializer,
    CourseUnAuthDetailSerializer, PurchaseCreateSerializer, StudentMyCourseSerializer, StudentMyCourseDetailSerializer,
    ReviewCreateSerializer, ReviewSerializer, ReportCreateSerializer, ReportSerializer, VideoSessionSerializer,
    TutorVideoSessionSerializer, ChunkUploadSerializer, VideoUploadSerializer
)
from .permissions import IsAdminUserCustom, IsProfileCompleted, IsUser, IsUserTutor, IsUserAdmin
from .services import CallUserService, UserServiceException
from .rabbitmq_publisher import publish_notification_event
from banners.utils import get_home_banner
from transactions.utils import record_course_purchase, record_course_refund, record_transaction_reported, change_transaction_status_back_to_pending
from course_service.zego_cloud.token04 import generate_token04
from .utils import mark_purchase_completed

logger = logging.getLogger(__name__)
call_user_service = CallUserService()

class HomeView(APIView):
    permission_classes = [IsUser]
    def get(self, request):
        user_id = request.user_payload['user_id']
        # Get 4 purchases for the user with related course data
        purchases = Purchase.objects.filter(user=user_id).select_related('course')[:4]
        my_course_serializer = StudentMyCourseSerializer(purchases, many=True)

        courses = Course.objects.filter(is_complete=True, is_available=True)[:3]
        course_serializer = CourseSerializer(courses, many=True)

        ad_details = get_home_banner()
        print('ad_details:', ad_details)
        banner_details = ad_details.get('home_banner')
        return Response({'my_courses': my_course_serializer.data, 'courses': course_serializer.data, 'banner_details': banner_details}, status=status.HTTP_200_OK)

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

# Upload Video In Chunks
class ChunkUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny] # [IsProfileCompleted]
    def post(self, request):
        print('ChunkUploadView post request:', request.data)
        serializer = ChunkUploadSerializer(data=request.data)
        if serializer.is_valid():
            upload_id = serializer.validated_data['upload_id']
            chunk_number = serializer.validated_data['chunk_number']
            total_chunks = serializer.validated_data['total_chunks']
            chunk = serializer.validated_data['chunk']
            file_name = serializer.validated_data['file_name']

            video_upload, created = VideoUpload.objects.get_or_create(
                upload_id=upload_id,
                defaults={'file_name': file_name, 'total_chunks': total_chunks}
            )

            # Define temporary chunk storage path
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', str(upload_id))
            os.makedirs(temp_dir, exist_ok=True)
            chunk_path = os.path.join(temp_dir, f'chunk_{chunk_number}')

            # Save chunk to temporary storage
            with open(chunk_path, 'wb') as f:
                for chunk_data in chunk.chunks():
                    f.write(chunk_data)

            # Update chunks_uploaded count
            video_upload.chunks_uploaded += 1
            video_upload.save()

            # Check if all chunks are uploaded
            if video_upload.chunks_uploaded == video_upload.total_chunks:
                # Assemble chunks into final file
                final_path = os.path.join(settings.MEDIA_ROOT, 'course_videos', f"{upload_id}_{file_name}_{timezone.now().strftime('%Y%m%d%H%M%S')}")
                os.makedirs(os.path.join(settings.MEDIA_ROOT, 'course_videos'), exist_ok=True)
                with open(final_path, 'wb') as final_file:
                    for i in range(1, total_chunks + 1):
                        chunk_path = os.path.join(temp_dir, f'chunk_{i}')
                        print('chunk_path:', chunk_path)
                        with open(chunk_path, 'rb') as chunk_file:
                            final_file.write(chunk_file.read())
                        os.remove(chunk_path)  # Clean up chunk

                # Update video_upload with final file path
                video_upload.file_path = final_path
                video_upload.save()
                print('fineal path:', final_path)

                # Clean up temp directory
                os.rmdir(temp_dir)

            return Response({
                'message': 'Chunk uploaded successfully',
                'upload_id': upload_id,
                'chunks_uploaded': video_upload.chunks_uploaded
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class CloudinaryUploadView(APIView):
#     def post(self, request):
#         upload_id = request.data.get('upload_id')
#         try:
#             video_upload = VideoUpload.objects.get(upload_id=upload_id)
#             if not video_upload.file_path:
#                 return Response({'error': 'Video not fully uploaded'}, status=status.HTTP_400_BAD_REQUEST)

#             # Upload to Cloudinary
#             result = cloudinary.uploader.upload(
#                 video_upload.file_path,
#                 resource_type="video",
#                 folder="videos_sample_chunk"
#             )
#             video_upload.cloudinary_url = result['secure_url']
#             video_upload.save()

#             # Clean up local file
#             os.remove(video_upload.file_path)

#             serializer = VideoUploadSerializer(video_upload)
#             return Response({
#                 'message': 'Video uploaded to Cloudinary successfully',
#                 'data': serializer.data
#             }, status=status.HTTP_200_OK)
#         except VideoUpload.DoesNotExist:
#             return Response({'error': 'Invalid upload_id'}, status=status.HTTP_404_NOT_FOUND)

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
stripe.api_key = settings.STRIPE_SECRET_KEY
class CoursePurchaseView(APIView):
    permission_classes = [IsProfileCompleted]
    
    def post(self, request, course_id):
        user_id = request.user_payload['user_id']
        
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the user has already purchased the course
        if Purchase.objects.filter(user=user_id, course=course).exists():
            return Response({'detail': 'You have already purchased this course'}, status=status.HTTP_400_BAD_REQUEST)
        
        if course.instructor == user_id:
            return Response({'detail': 'You cannot purchase your own course'}, status=status.HTTP_400_BAD_REQUEST)

        purchase_type = request.data.get('purchase_type')
        
        if purchase_type == 'freemium':
            # Handle freemium purchase (no payment required)
            purchase_data = {
                'user': user_id,
                'course': course_id,
                'purchase_type': 'freemium',
            }
            serializer = PurchaseCreateSerializer(data=purchase_data)
            if serializer.is_valid():
                serializer.save()
                publish_notification_event(
                   event_type='course.purchase',
                   data={
                       'student_id': user_id,
                       'tutor_id': course.instructor,
                       'course_title': course.title,
                       'purchase_type': 'freemium',
                   }
                )
                return Response({
                    'detail': 'Course purchased successfully',
                    'purchase_id': serializer.data.get('id'),
                    'is_freemium': True
                }, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # elif purchase_type == 'subscription':
        #     try:
        #         # Create Stripe Checkout Session
        #         checkout_session = stripe.checkout.Session.create(
        #             payment_method_types=['card'],
        #             line_items=[
        #                 {
        #                     'price_data': {
        #                         'currency': 'inr',
        #                         'unit_amount': int(course.subscription_amount * 100),  # Convert to cents
        #                         'product_data': {
        #                             'name': course.title,
        #                             'description': f'Subscription for {course.title}',
        #                         },
        #                     },
        #                     'quantity': 1,
        #                 },
        #             ],
        #             mode='payment',
        #             success_url=f'{request.data.get("frontend_url")}/student/courses/{course_id}/success?session_id={{CHECKOUT_SESSION_ID}}',
        #             cancel_url=f'{request.data.get("frontend_url")}/student/courses/{course_id}/cancel',
        #             metadata={
        #                 'user_id': str(user_id),
        #                 'course_id': str(course_id),
        #                 'purchase_type': 'subscription'
        #             }
        #         )
                
        #         # Create pending purchase
        #         purchase_data = {
        #             'user': user_id,
        #             'course': course_id,
        #             'purchase_type': 'subscription',
        #             'subscription_amount': course.subscription_amount,
        #             'video_session': course.video_session,
        #             'chat_upto': course.chat_upto,
        #             'safe_period': course.safe_period,
        #             'payment_status': 'pending',
        #             'stripe_checkout_session_id': checkout_session.id
        #         }
                
        #         serializer = PurchaseCreateSerializer(data=purchase_data)
        #         if serializer.is_valid():
        #             # purchase = serializer.save()
        #             print('checkout_session_id:', checkout_session.id)
        #             return Response({
        #                 'detail': 'Checkout session created',
        #                 'checkout_session_id': checkout_session.id,
        #                 'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY
        #             }, status=status.HTTP_200_OK)
        #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        #     except stripe.error.StripeError as e:
        #         return Response({
        #             'detail': 'Error creating checkout session',
        #             'error': str(e)
        #         }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'detail': 'Invalid purchase type'}, status=status.HTTP_400_BAD_REQUEST)

# from rest_framework.decorators import api_view
# @api_view(['POST'])
# def create_payment_intent(request, course_id):
#     """Create a payment intent for the course subscription"""
#     try:
#         course = Course.objects.get(id=course_id)
        
#         # Create a payment intent
#         intent = stripe.PaymentIntent.create(
#             amount=int(request.data.get('amount')),  # Amount in cents
#             currency='usd',
#             metadata={
#                 'course_id': course_id,
#                 'user_id': request.user.id,
#                 'purchase_type': 'subscription'
#             }
#         )
#         print('intent:', intent)
#         return Response({
#             'clientSecret': intent.client_secret
#         })
#     except Exception as e:
#         return Response({'error': str(e)}, status=400)

class CreatePaymentIntentView(APIView):
    permission_classes = [IsProfileCompleted]

    def post(self, request, course_id):
        try:
            user_id = request.user_payload['user_id']
            print('user_id in CreatePaymentIntentView:', user_id)
            course = Course.objects.get(id=course_id)
            print(course.subscription_amount, request.data.get('amount'))
            if course.subscription_amount != float(request.data.get('amount')):
                return Response({'error': 'Invalid amount', 'details': 'Amount mismatch'}, status=400)
            
            if course.instructor == user_id:
                return Response({'detail': 'You cannot purchase your own course'}, status=status.HTTP_400_BAD_REQUEST)

            # Create a payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(course.subscription_amount * 100),  # Amount in cents
                currency='usd',
                metadata={
                    'course_id': course_id,
                    'user_id': user_id,
                    'purchase_type': 'subscription'
                }
            )
            print('intent:', intent)
            return Response({
                'clientSecret': intent.client_secret
            })
        
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

# webhook for stripe payment
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# @method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    def post(self, request):
        print('Inside StripeWebhookView --------------------------------------------------')
        payload = request.body
        # print('payload:', payload)
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        # print('sig_header:', sig_header)
        try:
            print('before try')
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            print('after try')
        except ValueError as e:
            print('value error:', e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            print('signature verification error:', e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        print("event['type']:", event['type'])
        # if event['type'] == 'checkout.session.completed':
        #     session = event['data']['object']
        #     print('inside completed:', session['id'])
            # purchase = Purchase.objects.get(stripe_checkout_session_id=session['id'])
            # purchase.payment_status = 'completed'
            # purchase.stripe_payment_intent_id = session.get('payment_intent')
            # purchase.save()
        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            user_id = intent['metadata']['user_id']
            purchase_type = intent['metadata']['purchase_type']
            course_id = intent['metadata']['course_id']
            stripe_payment_intent_id = intent['id']

            print('event data:', user_id, purchase_type, course_id, stripe_payment_intent_id)
            try:
                course = Course.objects.get(id=course_id)
                print('course:', course)
            except Course.DoesNotExist:
                return Response({"error": "Course not found"}, status=404)
            
            purchase_data = {
                'user': user_id,
                'course': course_id,
                'purchase_type': purchase_type,
                'subscription_amount': course.subscription_amount,
                'video_session': course.video_session,
                'chat_upto': course.chat_upto,
                'safe_period': course.safe_period,
                'payment_status': 'completed',
                'stripe_payment_intent_id': stripe_payment_intent_id,
            }
            exists = Purchase.objects.filter(user=user_id, course=course_id).exists()
            if exists:
                purchase = Purchase.objects.get(user=user_id, course=course_id)

                # Only update if the existing purchase is freemium
                if purchase.purchase_type == 'freemium':
                    serializer = PurchaseCreateSerializer(purchase, data=purchase_data, partial=True)
                    
                    if serializer.is_valid():
                        purchase = serializer.save()

                        try:
                            record_course_purchase(purchase, 'stripe', stripe_payment_intent_id)
                        except IntegrityError:
                            return Response({"detail": "A database error occurred during course purchase. contact admin if amount is debited"}, status=status.HTTP_400_BAD_REQUEST)
                        except Exception as e:
                            return Response({"detail": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                        print('Freemium upgraded to subscription ----------------')
                        publish_notification_event(
                            event_type='course.upgraded',
                            data={
                                'student_id': user_id,
                                'tutor_id': course.instructor,
                                'course_title': course.title,
                                'purchase_type': 'subscription',
                            }
                        )
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    
                    print('serializer not valid', serializer.errors)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({"error": "User already has a subscription for this course"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = PurchaseCreateSerializer(data=purchase_data)
            if serializer.is_valid():
                purchase = serializer.save()
                try:
                    record_course_purchase(purchase, 'stripe', stripe_payment_intent_id)
                except IntegrityError:
                    return Response({"detail": "A database error occurred during course purchase. contact admin if amount is debited"}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    return Response({"detail": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                publish_notification_event(
                   event_type='course.purchase',
                   data={
                       'student_id': user_id,
                       'tutor_id': course.instructor,
                       'course_title': course.title,
                       'purchase_type': 'subscription',
                   }
                )
                print('saved----------------')
                return Response( serializer.data, status=status.HTTP_201_CREATED )
            print('serializer not valid', serializer.errors)
            return Response( serializer.errors, status=status.HTTP_400_BAD_REQUEST )

        return Response(status=status.HTTP_200_OK)

# List all courses purchased by a student
class StudentMyCoursesListView(APIView): 
    # permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
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

    def get(self, request, course_id):
        try:
            user_id = request.user_payload['user_id']
            purchase = Purchase.objects.get(course=course_id, user=user_id)
            serializer = StudentMyCourseDetailSerializer(purchase)
            # response_data = serializer.data
            # if purchase.purchase_type == 'freemium':
            #     ad_content = get_ad_content()
            #     response_data['ads'] = ad_content
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
                
            if correct_answers:
                mark_purchase_completed(purchase)
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
            mark_purchase_completed(purchase)
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

class AdViewedSubmitView(APIView):
    def post(self, request, item_id):
        try:
            user_id = request.user_payload['user_id']
            section_item = SectionItem.objects.get(id=item_id)
            # Check if the user has already purchased the course
            purchase = Purchase.objects.get(course=section_item.section.course, user=user_id)

            section_item_completion, created = SectionItemCompletion.objects.get_or_create(
                purchase=purchase, section_item=section_item,
                defaults={'ad_viewed': True}
            )
            if not created and not section_item_completion.ad_viewed:
                section_item_completion.ad_viewed = True
                section_item_completion.save()

            return Response({'status': 'updated ad_viewed'})
        
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
            # tutors = Course.objects.values('instructor').annotate(
            #     total_courses=Count('id'),
            #     total_enrollments=Count('purchases')
            # ).order_by('-total_enrollments')

            # Fetch top tutors based on course enrollments or ratings. Previously used the above method but giving wrong results for total_courses & total_enrollments.
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        c.instructor, 
                        COUNT(DISTINCT c.id) AS total_courses, 
                        COUNT(p.id) AS total_enrollments 
                    FROM courses_course c 
                    LEFT JOIN courses_purchase p ON p.course_id = c.id 
                    WHERE c.is_available = TRUE 
                    GROUP BY c.instructor 
                    ORDER BY total_enrollments DESC;
                """)
                # Fetch all rows and convert to list of dicts
                columns = ['instructor', 'total_courses', 'total_enrollments']
                rows = cursor.fetchall()
                tutors = [dict(zip(columns, row)) for row in rows]

            if not tutors:
                return Response({"message": "No tutors found."}, status=404)

            paginator = self.pagination_class()
            paginated_tutors = paginator.paginate_queryset(tutors, request)

            # Fetch tutor details from user service using the IDs
            tutor_ids = [tutor['instructor'] for tutor in paginated_tutors]
            try:
                response_user_service = call_user_service.get_users_details(tutor_ids)
            except UserServiceException as e:
                return Response({"error": str(e)}, status=503)
            except Exception as e:
                return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

            tutors_data = response_user_service.json()

            # Validate that the number of tutor details matches the number of tutors
            if len(tutors_data) != len(paginated_tutors):
                return Response(
                    {"error": "Mismatch between number of tutors and tutor details returned."},
                    status=500
                )

            result = [
                {
                    'tutor_id': tutor['instructor'],
                    'course_count': tutor['total_courses'],
                    'enrollment_count': tutor['total_enrollments'],
                    'tutor_details': details
                }
                for tutor, details in zip(paginated_tutors, tutors_data)
            ]
            # logger.debug(f"Returning {len(result)} top tutors: {result}")
            return paginator.get_paginated_response(result)

        except DatabaseError as db_error:
            logger.error(f"Database error for instructor: {str(e)}")
            return Response({"error": f"Database error: {str(db_error)}"}, status=500)

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

# Total courses and enrollments of a tutor - called from user_service
class StudentTutorAnalysisView(APIView):
    def get(self, request, id):
        try:
            # stats = Course.objects.filter(instructor=id, is_available=True).aggregate(
            #     total_courses=Count('id'),
            #     total_enrollments=Count('purchases')
            # )

            # Count the number of courses uploaded by the tutor. Previously used the above method but giving wrong results for total_courses & total_enrollments. 
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(DISTINCT c.id) AS total_courses,
                        COUNT(p.id) AS total_enrollments
                    FROM courses_course c
                    LEFT JOIN courses_purchase p ON p.course_id = c.id
                    WHERE c.instructor = %s AND c.is_available = TRUE;
                """, [id])
                row = cursor.fetchone()  # returns tuple
            total_courses, total_enrollments = row

            logger.debug(f"instructor: {id}, total_courses: {total_courses}, total_enrollments: {total_enrollments}")
            return Response({
                'total_courses': total_courses,
                'total_enrollments': total_enrollments,
            }, status=status.HTTP_200_OK)
        
        except DatabaseError as e:
            logger.error(f"Database error for instructor {id}: {str(e)}")
            return Response({"error": "A database error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Unexpected error for instructor {id}: {str(e)}")
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

            purchase = Purchase.objects.get(user=user_id, course=course)
            sections = SectionItem.objects.filter(section__course=course).count()
            completed_sections = SectionItemCompletion.objects.filter(purchase=purchase, completed=True).count()
            print('eligible to review:', sections, completed_sections)
            if sections != completed_sections:
                print('sections and completed are not equal')
                return Response({"error": "You have to complete the course to post a review"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ReviewCreateSerializer( data=request.data, context={'request': request} )
            
            if serializer.is_valid():
                print('serializer before publish:', serializer)
                serializer.save( user=user_id, course=course )
                publish_notification_event(
                    event_type='course.review',
                    data={
                        'student_id': user_id,
                        'tutor_id': course.instructor,
                        'course_title': course.title,
                        'rating': serializer.data['rating'],
                        'review': serializer.data['review']
                    }
                )
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

# Report a course
class ReportListCreateAPIView(APIView):
    permission_classes = [IsProfileCompleted]

    def post(self, request, course_id):
        print('here in Report')
        try:
            user_id = request.user_payload['user_id']
            course = Course.objects.get(id=course_id)
            
            # Check if user already reported this course
            if Report.objects.filter(user=user_id, course=course).exists():
                return Response({"error": "You have already reported this course"}, status=status.HTTP_400_BAD_REQUEST)

            purchase = Purchase.objects.get(user=user_id, course=course)
            serializer = ReportCreateSerializer( data=request.data, context={'request': request} )

            if serializer.is_valid():
                print('serializer before publish:', serializer)
                serializer.save( user=user_id, course=course )
                if purchase.purchase_type == 'subscription' and not purchase.is_safe_period_over: 
                    record_transaction_reported(purchase)
                publish_notification_event(
                    event_type='course.report',
                    data={
                        'student_id': user_id,
                        'tutor_id': course.instructor,
                        'course_title': course.title,
                        'report': serializer.data['report']
                    }
                )
                return Response( serializer.data, status=status.HTTP_201_CREATED )
            return Response( serializer.errors, status=status.HTTP_400_BAD_REQUEST )
            
        except Purchase.DoesNotExist:
            return Response({"error": "You must purchase the course to report it"}, status=status.HTTP_403_FORBIDDEN)

        except Course.DoesNotExist:
            return Response( {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND )

        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

class AdminListReportsAPIView(APIView):
    permission_classes = [IsAdminUserCustom]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            reports = Report.objects.all()
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(reports, request)
            serializer = ReportSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class AdminReportActionPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, report_id):
        try:
            print('AdminReportActionPIView course_service')
            report = Report.objects.get(id=report_id)
            purchase = Purchase.objects.get(course=report.course, user=report.user)
            if request.data.get('status') == 'refunded':
                if report.resolved:
                    return Response({"error": "Report already resolved"}, status=status.HTTP_400_BAD_REQUEST)
                if purchase.purchase_type == 'freemium':
                    return Response({"error": "Freemium purchase cannot be refunded"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ReportSerializer(report, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(resolved = True)
                if serializer.data['status'] == 'refunded':
                    record_course_refund(purchase)
                    publish_notification_event(
                        event_type='course.report.refund',
                        data={
                            'student_id': report.user,
                            'tutor_id': report.course.instructor,
                            'course_title': report.course.title,
                            'amount': str(purchase.subscription_amount),
                        }
                    )

                if serializer.data['status'] == 'rejected' or serializer.data['status'] == 'resolved':
                    if purchase.purchase_type == 'subscription':
                        change_transaction_status_back_to_pending(purchase)
                    publish_notification_event(
                        event_type='course.report.resolved' if serializer.data['status'] == 'resolved' else 'course.report.rejected',
                        data={
                            'student_id': report.user,
                            'tutor_id': report.course.instructor,
                            'course_title': report.course.title,
                            'amount': str(purchase.subscription_amount),
                        }
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
# Fetch Reviews of a course for a student, incuding own review and report if any
class StudentCourseFeedbackView(APIView):
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
            my_report = Report.objects.filter(course=course, user=user_id).first()
            if my_report:
                my_report_serializer = ReportSerializer(my_report)

            reviews = Review.objects.filter(course=course).exclude(user=user_id)[:10]
            serializer = ReviewSerializer(reviews, many=True)
            serializer_data = serializer.data
            user_ids = [review['user'] for review in serializer_data]
            print('user_ids:', user_ids)
            result = []
            if len(user_ids):
                try:
                    response_user_service = call_user_service.get_users_details(user_ids)
                except UserServiceException as e:
                    # Handle user service exceptions and return appropriate error
                    return Response({"error": str(e)}, status=503)
                except Exception as e:
                    # Catch any unexpected exceptions
                    return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

                users_data = response_user_service.json()
                if len(users_data) != len(serializer_data):
                    return Response(
                        {"error": "Mismatch between number of tutors and tutor details returned."},
                        status=500
                    )

                for review, user in zip(serializer_data, users_data):
                    print('user:', user)
                    review['full_name'] = user['first_name'] + ' ' + user['last_name']
                    review['user_image'] = user['image']
                    result.append(review)

            print('result:', result)
            data = {
                'my_review': my_review_serializer.data if my_review else None,
                'my_report': my_report_serializer.data if my_report else None,
                'reviews': result
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

# request a video session by the student.
class ScheduleSessionView(APIView):
    permission_classes = [IsUser]

    def post(self, request, purchase_id):
        user_id = request.user_payload['user_id']
        purchase = Purchase.objects.get(id=purchase_id)
        tutor = purchase.course.instructor
        student = purchase.user

        # checking if not the requested user is either tutor or student.
        if student != user_id: # tutor != user_id and
            return Response({'detail': 'you should be a member of the purchase to schedule a session'}, status=status.HTTP_403_FORBIDDEN)

        # checking if the tutor trying to request a session.
        if request.data.get('status') != 'pending': # and student != user_id:
            return Response({'detail': 'a request status can only be pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        # # checking if the student trying to change the status of the schedule.
        # if request.data.get('status') == 'approved' and tutor != user_id:
        #     return Response({'detail': 'only tutor have the authority to approve a session'}, status=status.HTTP_400_BAD_REQUEST)
        
        # checking if freemium user trying for a video session.
        if purchase.purchase_type != 'subscription' and not purchase.video_session:
            return Response({'detail': 'Only subscribed user has access to the feature'}, status=status.HTTP_400_BAD_REQUEST)

        # checking if the user already has a pending session or not.
        if purchase.video_sessions.filter(Q(status='pending') | Q(status='approved')).exists():
            return Response({'detail': 'You already have a pending session'}, status=status.HTTP_409_CONFLICT)

        # checking if the user have already used all his available video sessions or not.
        if purchase.video_sessions.count() >= purchase.video_session:
            return Response({'detail': 'Your available video sessions are over'}, status=status.HTTP_403_FORBIDDEN)
        

        request.data['tutor'] = tutor
        request.data['student'] = student

        print('request data;', request.data)

        serializer = VideoSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(purchase=purchase)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print('errors:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # def patch(self, request, pk):
    #     try:
    #         user_id = request.user_payload['user_id']
    #         session = VideoSession.objects.get(pk=pk)
    #         print('user:', user_id, 'session:', session)
    #         print('request data:', request.data)
    #         return Response({'working':'well'})
    #     except VideoSession.DoesNotExist:
    #         return Response({"error": "Video Session not found"}, status=status.HTTP_404_NOT_FOUND)
    #     except Exception as e:
    #         return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# list video sessions of a tutor
class TutorVideoSessionsView(APIView):
    permission_classes = [IsUser]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            user_id = request.user_payload['user_id']
            sessions = VideoSession.objects.filter(tutor=user_id)
            status_param = request.query_params.get('status', None)
            print('status_param:', status_param)
            if status_param:
                sessions = sessions.filter(status=status_param)

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(sessions, request)
            print('page:', page)
            user_ids = {session.student for session in page}
            print('user ids Videos session:', user_ids)
            users_dict={}
            if user_ids:
                response_user_service = call_user_service.get_users_details(list(user_ids))
                users_data = response_user_service.json()
                users_dict = {user['id']: user for user in users_data}
                print('users_data:', users_data)
            serializer = TutorVideoSessionSerializer(page, many=True, context={"users_dict": users_dict})
            return paginator.get_paginated_response(serializer.data)

        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        
        except Exception as e:
            return Response({'detail': f'Error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


# from .models import VideoSession
# from .serializers import VideoSessionSerializer, VideoSessionScheduleSerializer
# from dateutil import parser

# class TutorSessionViewSet(viewsets.ModelViewSet):
#     """
#     ViewSet for tutors to manage their teaching sessions.
#     Includes filtering by status, pagination, and scheduling functionality.
#     """
#     serializer_class = VideoSessionSerializer
#     permission_classes = [IsUser]
#     filter_backends = [filters.OrderingFilter]
#     ordering_fields = ['created_at', 'scheduled_time', 'status']
#     ordering = ['-created_at']
    
#     def get_queryset(self):
#         """
#         Return sessions where the current user is the tutor.
#         Filter by status if provided in query params.
#         """
#         user_id = self.request.user_payload['user_id']
#         queryset = VideoSession.objects.filter(tutor=user_id)
        
#         # Filter by status if provided
#         status_filter = self.request.query_params.get('status', None)
#         if status_filter and status_filter != 'all':
#             queryset = queryset.filter(status=status_filter)
            
#         return queryset
    
#     def update(self, request, *args, **kwargs):
#         """
#         Override update to handle scheduling logic when approving sessions.
#         """
#         try:
#             instance = self.get_object()
#             print(f"Retrieved instance: {instance}")
#             # Check if the user is the tutor for this session
#             if instance.tutor != request.user_payload['user_id']:
#                 return Response(
#                     {"detail": "You don't have permission to update this session."},
#                     status=status.HTTP_403_FORBIDDEN
#                 )
            
#             print('request data:', request.data)
#             status = request.data['status']
#             scheduled_time = request.data['scheduled_time']
#             duration_minutes = request.data['duration_minutes']
#             formated_time = parser.parse(scheduled_time)
#             end_time = formated_time + timedelta(minutes=int(duration_minutes))

#             print('formated_time:', formated_time, end_time)

#             # If we're updating status to approved and there's scheduling data
#             # if 'scheduled_time' in request.data and request.data.get('status') == 'approved':
#             #     # Use a separate serializer for scheduling validation
#             #     schedule_serializer = VideoSessionScheduleSerializer(instance, data=request.data, context={'request': request})
#             #     schedule_serializer.is_valid(raise_exception=True)
                
#             #     # Parse scheduled time from frontend (assuming ISO format)
#             #     try:
#             #         # Convert the string to datetime object
#             #         scheduled_time_str = request.data.get('scheduled_time')
#             #         duration_minutes = int(request.data.get('duration_minutes', 60))
                    
#             #         # Parse the datetime string
#             #         scheduled_time = parser.parse(scheduled_time_str)
                    
#             #         # If the datetime is naive (no timezone info), assume it's in the user's timezone
#             #         if scheduled_time.tzinfo is None:
#             #             # Get the timezone from settings
#             #             asia_kolkata = pytz.timezone('Asia/Kolkata')
#             #             scheduled_time = asia_kolkata.localize(scheduled_time)
                    
#             #         # Convert to UTC for storage
#             #         scheduled_time_utc = scheduled_time.astimezone(pytz.UTC)
                    
#             #         # Calculate ending time
#             #         ending_time_utc = scheduled_time_utc + timedelta(minutes=duration_minutes)
                    
#             #         # Update the request data
#             #         request.data['scheduled_time'] = scheduled_time_utc
#             #         request.data['ending_time'] = ending_time_utc
                    
#         except (ValueError, TypeError) as e:
#             return Response(
#                 {"detail": f"Invalid date format: {str(e)}"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
                
#         return super().update(request, *args, **kwargs)
    
#     @action(detail=True, methods=['post'])
#     def mark_completed(self, request, pk=None):
#         """
#         Custom action to mark a session as completed.
#         """
#         session = self.get_object()
        
#         # Check if the user is the tutor for this session
#         if session.tutor != request.user_payload['user_id']:
#             return Response(
#                 {"detail": "You don't have permission to update this session."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
            
#         # Check if the session is eligible to be marked as completed
#         if session.status != 'approved':
#             return Response(
#                 {"detail": "Only approved sessions can be marked as completed."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
            
#         # Update the session status
#         session.status = 'completed'
#         session.save()
        
#         serializer = self.get_serializer(session)
#         return Response(serializer.data)
    
class VideoSessionUpdateView(APIView):
    def get_object(self, pk):
        try:
            return VideoSession.objects.get(pk=pk)
        except VideoSession.DoesNotExist:
            raise Http404

    def patch(self, request, pk, format=None):
        user_id = request.user_payload['user_id']
        session_status = request.data.get('status')
        session = self.get_object(pk)
        if not user_id == session.purchase.course.instructor:
            return Response({'error': 'only tutor has the access to this course'}, status=status.HTTP_403_FORBIDDEN)
        
        if session_status == 'completed':
            request.data['is_active'] = False
        serializer = VideoSessionSerializer(session, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class GetSessionTokenView(APIView):
    permission_classes = [IsUser]

    def post(self, request):
        session_id = request.data.get("session_id")
        print('session_id', session_id)
        try:
            user_id = request.user_payload['user_id']
            session = VideoSession.objects.get(id=session_id, is_active=True)

            # Verify user is either tutor or student
            if user_id not in [session.tutor, session.student]:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if session is within a valid time window (e.g., 1 minutes before to end of session)
            now = timezone.now()
            session_end = session.scheduled_time + timezone.timedelta(minutes=session.duration_minutes)
            print('before if')
            if now < session.scheduled_time - timezone.timedelta(minutes=5) or now > session_end:
                return Response({"error": "Session not active"}, status=status.HTTP_400_BAD_REQUEST)

            print('before generate_zego_token')
            payload = {
                "room_id": session.room_id, # Room ID
                "privilege": {
                    1 : 1, # key 1 represents room permission, value 1 represents allowed, so here means allowing room login; if the value is 0, it means not allowed
                    2 : 1  # key 2 represents push permission, value 1 represents allowed, so here means allowing push; if the value is 0, it means not allowed
                }, 
                "stream_id_list": None # Passing None means that all streams can be pushed. If a streamID list is passed in, only the streamIDs in the list can be pushed
            }
            effective_time_in_seconds = session.duration_minutes * 60
            token_info = generate_token04(app_id=int(settings.ZEGO_APP_ID), user_id=str(user_id), secret=settings.ZEGO_SERVER_SECRET, 
                                     effective_time_in_seconds=effective_time_in_seconds, payload=json.dumps(payload))
            
            print([token_info.token, token_info.error_code, token_info.error_message])
            return Response({
                "token": token_info.token,
                "app_id": int(settings.ZEGO_APP_ID),
                "room_id": session.room_id,
                "user_id": str(user_id),
            })
        except VideoSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        