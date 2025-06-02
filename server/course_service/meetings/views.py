from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from courses.permissions import IsAdminUserCustom, IsUserAdmin
from .models import CommunityVideoMeeting
from .serializers import CommunityVideoMeetingSerializer

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
        is_active = request.data.get('is_active')
        meeting = get_object_or_404(CommunityVideoMeeting, id=id)
        print('request data;', request.data)
        if is_active is None:
            return Response({"error": "is_active field is required."}, status=status.HTTP_400_BAD_REQUEST)
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



