from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from courses.permissions import IsAdminUserCustom, IsProfileCompleted, IsUser, IsUserTutor, IsUserAdmin
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



