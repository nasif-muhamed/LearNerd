from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from . models import Profile
from . serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        try:
            profile = Profile.objects.get(pk=pk)
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)

        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            profile = Profile.objects.get(pk=pk)
        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsersView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            users = Profile.objects.all()
            print(users)
        except Profile.DoesNotExist:
            return Response({'error': 'Users not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(users, many=True)
        return Response(serializer.data)