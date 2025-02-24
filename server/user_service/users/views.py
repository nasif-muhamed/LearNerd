import pyotp
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from . models import Profile, AdminUser
from . serializers import RegisterSerializer, ProfileSerializer, CustomTokenObtainPairSerializer, UserActionSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            totp = pyotp.TOTP(pyotp.random_base32())
            otp = totp.now()
            cache.set(email, {'otp': otp, 'data': serializer.validated_data}, timeout=300)  # 5 minutes expiry
            
            subject = 'Your One Time Password (OTP) for LearNerds'
            message = f'Your OTP code is {otp}'
            email_from = settings.EMAIL_HOST_USER
            recipient_list = [email]
            send_mail(subject, message, email_from, recipient_list, fail_silently=False)
                        
            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        cache_data = cache.get(email)

        if cache_data and cache_data['otp'] == otp:
            serializer = RegisterSerializer(data=cache_data['data'])

            if serializer.is_valid():
                user = serializer.save()
                cache.delete(email)
                return Response({'message': 'User registered successfully', 'id': user.id}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        
        try:
            profile = request.user
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)

        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            profile = request.user
            print("Received Data:", request.data) # Debugging

        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        print("Serializer Errors:", serializer.errors)  # Debugging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def is_admin(user):
    return AdminUser.objects.filter(profile=user).exists()

class UserActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        # Check if the requesting user is an admin
        user =  request.user
        if not is_admin(user) or user.pk == pk:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = Profile.objects.get(pk=pk)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserActionSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User status updated successfully', 'data': serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            if is_admin(request.user):
                users = Profile.objects.all()
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except Profile.DoesNotExist:
            return Response({'error': 'Users not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(users, many=True)
        return Response(serializer.data)