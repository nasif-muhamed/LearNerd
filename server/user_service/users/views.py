from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from . models import Profile, AdminUser
from . serializers import ProfileSerializer, CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ProfileSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            profile = request.user
            if profile.pk == pk:
                serializer = ProfileSerializer(profile)
                return Response(serializer.data)
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            profile = request.user
            if profile.pk != pk:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            user = request.user
            is_admin = AdminUser.objects.filter(profile=user).exists()

            if is_admin:
                users = Profile.objects.all()
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except Profile.DoesNotExist:
            return Response({'error': 'Users not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(users, many=True)
        return Response(serializer.data)