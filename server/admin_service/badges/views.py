import json

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import AnonymousUser

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

from .models import Badges, Questions, Answers
from .serializers import BadgeSerializer, SimplifiedBadgeSerializer
from .message_broker.rabbitmq_publisher import publish_chat_event
from admins.utils import CallUserService, UserServiceException, CallCourseService, CourseServiceException

call_user_service = CallUserService()
call_course_service = CallCourseService()

class CustomPagination(PageNumberPagination):
    page_size = 3  # Default items per page
    page_size_query_param = 'page_size'  # Allow client to override page size
    max_page_size = 100  # Maximum limit for page_size

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

class BadgesView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]
    
    def get(self, request):
        # Return the list of badges without questions and answers
        try:
            badges = Badges.objects.all().order_by('-created_at')
            search_query = request.query_params.get('search', None)

            if search_query:
                badges = badges.filter(title__icontains=search_query)

            # Apply filtering
            community = request.query_params.get('community', None)
            if community is not None:
                badges = badges.filter(community=community.lower() == 'true')

            # is_active = request.query_params.get('is_active', None)
            # if is_active is not None:
            #     users = users.filter(is_active=is_active.lower() == 'true')

            # Apply sorting
            # ordering = request.query_params.get('ordering', '-created_at')
            # allowed_ordering = ['created_at', '-created_at', 'is_active', '-is_active']
            # if ordering in allowed_ordering:
            #     users = users.order_by(ordering)
            # else:
            #     users = users.order_by('-created_at')  # Default sorting

            # Apply pagination
            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(badges, request)

            serializer = SimplifiedBadgeSerializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        except Badges.DoesNotExist:
            return Response(
                {'error': 'Badges not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        user = request.user
        print('BadgesView user: ', user)

        try:
            response = call_user_service.get_admin_user_details(
                admin=user
            )
            admin = response.json()
            print('admin badge view:', admin)
            serializer = BadgeSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                print('Validated data:', serializer.validated_data)
                serializer.save()
                print('BadgesView serializer data:', serializer.data)
                if serializer.data['community']:
                    publish_chat_event(
                        event_type='create_group_chat_room',
                        data={
                            'name': serializer.data['title'],
                            'image': serializer.data['image_url'],
                            'admin': admin,
                        }
                    )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            print('Serializer errors:', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except UserServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        



class BadgeView(APIView):
    # permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    def get_permissions(self):
        if self.request.method == 'PATCH':
            return [IsAdminUser()]
        return [AllowAny()]
    

    def get(self, request, id):
        try:
            user = request.user
            print('BadgeView user:', user, type(user))
            badge = Badges.objects.get(id=id)
            print('badge:', badge)
            serializer = BadgeSerializer(badge)
            serializer_data = serializer.data
            if not isinstance(user, AnonymousUser) and user.is_staff:
                course_response = call_course_service.get_community_scheduled_meeting(request, badge.id)
                meeting = course_response.json()
                serializer_data['meeting'] = meeting if meeting else None
                print('meeting:', meeting)
            return Response(serializer_data)
        except Badges.DoesNotExist:
            return Response({'detail': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request, id):
        badge = get_object_or_404(Badges, id=id)
        serializer = BadgeSerializer(badge, data=request.data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EvaluateQuizView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        badge_id = request.data.get('badge_id')
        user_answers = request.data.get('answers') 
        print('here evaluadt______________=====')
        try:
            badge = Badges.objects.get(id=badge_id)
            questions = Questions.objects.filter(badge_id=badge_id)
            total_questions = badge.total_questions
            pass_mark = badge.pass_mark

            # Calculate score
            correct_answers = 0
            for question in questions:
                user_answer_id = user_answers.get(str(question.id))
                if user_answer_id:
                    correct_answer = Answers.objects.get(
                        question_id=question.id, 
                        is_correct=True
                    )
                    if int(user_answer_id) == correct_answer.id:
                        correct_answers += 1
            print('came up here1')
            serializer = BadgeSerializer(badge)
            print('came up here')
            print(serializer.data['image_url'])
            # Prepare response
            result = {
                'image': serializer.data['image_url'],
                'title': serializer.data['title'],
                'badge_id': badge_id,
                'total_questions': total_questions,
                'pass_mark': pass_mark,
                'acquired_mark': correct_answers,
                'is_passed': correct_answers >= pass_mark,
                'community': badge.community, 
            }
            print('result:', result)
            return Response(result, status=status.HTTP_200_OK)

        except Badges.DoesNotExist:
            return Response(
                {"error": "Badge not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

