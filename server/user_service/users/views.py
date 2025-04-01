import random
import time
import os
import requests
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken

from . firebase_auth import auth as firebase_auth
from . models import AdminUser, BadgesAquired
from . serializers import RegisterSerializer, ProfileSerializer, CustomTokenObtainPairSerializer, UserActionSerializer, \
    BadgesAquiredSerializer, BadgeSerializer, ForgotPasswordSerializer, ForgotPasswordOTPVerifySerializer, ForgotPasswordResetSerializer, \
    ProfileDetailsSerializer
from .tasks import send_otp_email


Profile = get_user_model()
ADMIN_SERVICE_URL = os.getenv('ADMIN_SERVICE_URL')


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = random.randint(100000, 999999)
            # Store OTP, user data, and metadata in cache
            
            subject = 'Your One Time Password (OTP) for LearNerds'
            message = f'Your OTP code is {otp}'
            print(message)
            recipient_list = [email]
            send_otp_email.delay(subject, message, recipient_list)
                        
            cache_data = {
                'otp': otp,
                'data': serializer.validated_data,
                'last_sent': time.time(),  # Timestamp of when OTP was last sent
            }
            
            cache.set(email, cache_data, timeout=180)  # 3 minutes expiry

            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        cache_data = cache.get(email)
        current_time = time.time()
        if not cache_data:
            return Response({'detail': 'No active password reset session found. Please start the password reset process again.'}, 
                            status=status.HTTP_400_BAD_REQUEST)

        if abs(current_time - cache_data['last_sent']) > 60:
            return Response({'detail': 'OTP expired. Try resend OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if cache_data['otp'] == int(otp):
            serializer = RegisterSerializer(data=cache_data['data'])

            if serializer.is_valid():
                user = serializer.save()
                cache.delete(email) # Clear cache after successful registration
                return Response({'message': 'User registered successfully', 'id': user.id}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        flow = request.data.get('flow')  # Expected to be either 'register' or 'forgot_password'

        if not email or not flow:
            return Response({'detail': 'Email and flow are required.'}, 
                           status=status.HTTP_400_BAD_REQUEST)

        if flow not in ['register', 'forgot_password']:
            return Response({'detail': 'Invalid flow. Must be "register" or "forgot_password".'}, 
                           status=status.HTTP_400_BAD_REQUEST)

        # Determine cache key based on flow
        cache_key = email if flow == 'register' else f"forgot_password_{email}"
        cache_data = cache.get(cache_key)

        if not cache_data:
            return Response({'detail': 'No active session found. Please start the process again.'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        current_time = time.time()
        # Check if enough time has passed since the last OTP was sent (e.g., 60 seconds cooldown)
        last_sent = cache_data.get('last_sent', 0)
        cooldown_period = 60  # 60 seconds cooldown

        if current_time - last_sent < cooldown_period:
            remaining_time = int(cooldown_period - (current_time - last_sent))
            return Response({'detail': f'Please wait {remaining_time} seconds before resending OTP.'}, 
                           status=status.HTTP_429_TOO_MANY_REQUESTS)

        new_otp = random.randint(100000, 999999)
        cache_data['otp'] = new_otp

        # Customize email subject and message based on flow
        if flow == 'register':
            subject = 'Your New One Time Password (OTP) for LearNerds'
            message = f'Your new OTP code is {new_otp}'
        else:  # flow == 'forgot_password'
            subject = 'Your New One Time Password (OTP) for Password Reset'
            message = f'Your new OTP code for password reset is {new_otp}'

        # Send the new OTP via email
        print(message)  # For debugging; replace with logging in production
        recipient_list = [email]
        send_otp_email.delay(subject, message, recipient_list)
        cache_data['last_sent'] = current_time
        cache.set(cache_key, cache_data, timeout=180)  # Reset the 3-minute expiry

        return Response({'message': 'New OTP sent successfully'}, status=status.HTTP_200_OK)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')  # Firebase ID token from frontend
        print('token:', token)
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the Firebase token
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email')
            print('google:', decoded_token)
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
            # Get or create the user
            user, created = Profile.objects.get_or_create(
                email=email,
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'registered': created,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = random.randint(100000, 999999)

            # Store OTP and metadata in cache
            subject = 'Your One Time Password (OTP) for Password Reset'
            message = f'Your OTP code for password reset is {otp}'
            print(message)  # For debugging; replace with logging in production
            email_from = settings.EMAIL_HOST_USER
            recipient_list = [email]
            send_mail(subject, message, email_from, recipient_list, fail_silently=False)

            cache_data = {
                'otp': otp,
                'last_sent': time.time(),  # Timestamp of when OTP was last sent
            }
            
            cache.set(f"forgot_password_{email}", cache_data, timeout=180)  # 3 minutes expiry

            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordOTPVerifySerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            cache_key = f"forgot_password_{email}"
            cache_data = cache.get(cache_key)
            current_time = time.time()

            if not cache_data:
                return Response({'detail': 'No active password reset session found. Please start the password reset process again.'}, 
                               status=status.HTTP_400_BAD_REQUEST)

            if abs(current_time - cache_data['last_sent']) > 60:
                return Response({'detail': 'OTP expired. Try resend OTP.'}, status=status.HTTP_400_BAD_REQUEST)

            if cache_data['otp'] == int(otp):
                # OTP is valid; store a flag in cache to indicate OTP verification success
                cache_data['otp_verified'] = True
                cache.set(cache_key, cache_data, timeout=180)  # Reset the 3-minute expiry
                return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)

            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordResetSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            cache_key = f"forgot_password_{email}"
            cache_data = cache.get(cache_key)

            if not cache_data:
                return Response({'detail': 'OTP verification required. Please verify OTP first.'}, 
                               status=status.HTTP_400_BAD_REQUEST)

            if not cache_data.get('otp_verified', False):
                return Response({'detail': 'OTP verification required. Please verify OTP first.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Retrieve the user
            user = Profile.objects.get(email=email)

            # Check if the new password is the same as the current password
            if user.check_password(password):
                return Response({'detail': 'New password cannot be the same as the current password.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Update the user's password
            user.set_password(password)
            user.save()

            # Clear the cache after successful password reset
            cache.delete(cache_key)

            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

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


class UserDetailsView(RetrieveAPIView):  # for anyone to see the profile details
    queryset = Profile.objects.all()
    serializer_class = ProfileDetailsSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'


def is_admin(user):
    return AdminUser.objects.filter(profile=user).exists()

# class CheckIsAdmin(APIView):
#     permission_classes = [IsAuthenticated]
#     def get(self, request, pk):
#         user =  request.user
#         if not is_admin(user):
#             return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
#         return Response({'message': 'Access granted'}, status=status.HTTP_200_OK)


class UserActionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user =  request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user_to_fetch = Profile.objects.get(pk=pk)
            serializer = UserActionSerializer(user_to_fetch)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        # Check if the requesting user is an admin
        user =  request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_to_modify = Profile.objects.get(pk=pk)
            if is_admin(user_to_modify):
                return Response({'error': 'You should not block admin'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        print('user_to_modify', user_to_modify)
        user_to_modify.is_active = not user_to_modify.is_active
        user_to_modify.save()

        serializer = UserActionSerializer(user_to_modify)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CustomPagination(PageNumberPagination):
    page_size = 3  # Default items per page
    page_size_query_param = 'page_size'  # Allow client to override page size
    max_page_size = 100  # Maximum limit for page_size

    def get_paginated_response(self, data):
            # Get the next and previous page numbers
            next_page = self.get_next_link()
            previous_page = self.get_previous_link()

            # Extract just the query parameters
            print('is:',isinstance(next_page, str), next_page)
            print('is:',isinstance(previous_page, str), previous_page)

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
    
class UsersView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            if not is_admin(request.user):
                return Response(
                    {'error': 'Access denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the base queryset
            users = Profile.objects.all()

            # Apply search
            search_query = request.query_params.get('search', None)
            if search_query:
                users = users.filter(
                    Q(email__icontains=search_query) |
                    Q(first_name__icontains=search_query) |
                    Q(last_name__icontains=search_query)
                )

            # Apply filtering
            is_tutor = request.query_params.get('is_tutor', None)
            if is_tutor is not None:
                users = users.filter(is_tutor=is_tutor.lower() == 'true')

            is_active = request.query_params.get('is_active', None)
            if is_active is not None:
                users = users.filter(is_active=is_active.lower() == 'true')

            # Apply sorting
            ordering = request.query_params.get('ordering', '-created_at')
            allowed_ordering = ['created_at', '-created_at', 'is_active', '-is_active']
            if ordering in allowed_ordering:
                users = users.order_by(ordering)
            else:
                users = users.order_by('-created_at')  # Default sorting

            # Apply pagination
            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)

            # Serialize the data
            serializer = ProfileSerializer(paginated_users, many=True)
            
            return paginator.get_paginated_response(serializer.data)

        except Profile.DoesNotExist:
            return Response(
                {'error': 'Users not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MyBadgesView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated

    def get_queryset(self):
        return BadgesAquired.objects.filter(profile=self.request.user)


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        badge_id = request.data.get('badge_id')
        answers = request.data.get('answers')
        user = request.user

        # Call badge_service to evaluate
        badge_service_url = f"{ADMIN_SERVICE_URL}api/v1/badges/evaluate/"
        print('badgeUrl:', badge_service_url)
        try:
            response = requests.post(
                badge_service_url,
                json={'badge_id': badge_id, 'answers': answers},
                timeout=5
            )
            response.raise_for_status()
            result = response.json()
        except requests.RequestException as e:
            return Response(
                {"error": f"Failed to evaluate quiz: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Check if this is a new attempt or update existing
        print('here1')
        badge_acquired, created = BadgesAquired.objects.get_or_create(
            profile=user,
            badge_id=badge_id,
            defaults={
                'badge_title': result['title'],  # Fetch from badge_service if needed
                'badge_image': result['image'],  # Fetch from badge_service if needed
                'total_questions': result['total_questions'],
                'pass_mark': result['pass_mark'],
                'aquired_mark': result['acquired_mark'],
                'attempts': 1
            }
        )
        print('here2')

        if not created:
            # Update existing record
            if badge_acquired.aquired_mark < result['acquired_mark']:
                badge_acquired.aquired_mark = result['acquired_mark']
            badge_acquired.badge_title = result['title']
            badge_acquired.badge_image = result['image']
            badge_acquired.attempts += 1
            badge_acquired.save()

        serializer = BadgesAquiredSerializer(badge_acquired)
        return Response({
            'badge_acquired': serializer.data,
            'aquired_mark': result['acquired_mark'],
            'is_passed': result['is_passed']
        }, status=status.HTTP_201_CREATED)
