import logging
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from course_service.zego_cloud.token04 import generate_token04
from courses.permissions import IsAdminUserCustom, IsUserAdmin, IsUser
from .models import CommunityVideoMeeting
from .serializers import CommunityVideoMeetingSerializer
from courses.services import CallUserService, UserServiceException

logger = logging.getLogger(__name__)
call_user_service = CallUserService()

class ScheduleCommunityMeetingView(APIView):
    permission_classes = [IsUserAdmin]

    def post(self, request):
        admin_id = request.user_payload['user_id']
        request.data['scheduler'] = admin_id
        print('request data;', request.data)

        serializer = CommunityVideoMeetingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print('errors:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        id = request.data.get('id')
        meeting = get_object_or_404(CommunityVideoMeeting, id=id)
        print('request data;', request.data)
        serializer = CommunityVideoMeetingSerializer(meeting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        print('errors:', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCommunityMeetingView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, badge_id):
        try:
            meeting = CommunityVideoMeeting.objects.filter(badge=badge_id, is_active=True).first()
            if meeting:
                serializer = CommunityVideoMeetingSerializer(meeting)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GetCommunityMeetingTokenView(APIView):
    permission_classes = [IsUser]

    def post(self, request):
        meeting_id = request.data.get("meeting_id")
        logger.debug(f'session_id {meeting_id}')
        try:
            user_id = request.user_payload['user_id']
            is_admin = request.user_payload.get('is_admin', False)
            meeting = CommunityVideoMeeting.objects.get(id=meeting_id, is_active=True, status='in_progress')
            if not is_admin:
                user_service_responce = call_user_service.get_user_badge_exist(user_id, meeting.badge)
                user_data = user_service_responce.json()
                if user_data.get('exists', False) is False:
                    return Response({"error": "User does not have access to this meeting"}, status=status.HTTP_403_FORBIDDEN)

            payload = {
                "room_id": meeting.room_id, # Room ID
                "privilege": {
                    1 : 1, # key 1 represents room permission, value 1 represents allowed, so here means allowing room login; if the value is 0, it means not allowed
                    2 : 1  # key 2 represents push permission, value 1 represents allowed, so here means allowing push; if the value is 0, it means not allowed
                }, 
                "stream_id_list": None # Passing None means that all streams can be pushed. If a streamID list is passed in, only the streamIDs in the list can be pushed
            }
            effective_time_in_seconds = 60 * 60 # 1 hour
            token_info = generate_token04(app_id=int(settings.ZEGO_APP_ID), user_id=str(user_id), secret=settings.ZEGO_SERVER_SECRET, 
                                     effective_time_in_seconds=effective_time_in_seconds, payload=json.dumps(payload))
            
            print([token_info.token, token_info.error_code, token_info.error_message])
            return Response({
                "token": token_info.token,
                "app_id": int(settings.ZEGO_APP_ID),
                "room_id": meeting.room_id,
                "user_id": str(user_id),
            })
        except CommunityVideoMeeting.DoesNotExist:
            return Response({"error": "Meeting not found"}, status=status.HTTP_404_NOT_FOUND)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


