import random
import time
import os
import requests
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics
# from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed

from . firebase_auth import auth as firebase_auth
from . models import AdminUser, BadgesAquired, Notification, Wallet
from . serializers import RegisterSerializer, ProfileSerializer, CustomTokenObtainPairSerializer, UserActionSerializer, \
    BadgesAquiredSerializer, BadgeSerializer, ForgotPasswordSerializer, ForgotPasswordOTPVerifySerializer, ForgotPasswordResetSerializer, \
    ProfileDetailsSerializer, NotificationSerializer, WalletSerializer
from .tasks import send_otp_email
from .services import CallCourseService, CourseServiceException
from .message_broker.rabbitmq_publisher import publish_chat_event
from .utils import is_admin
Profile = get_user_model()
ADMIN_SERVICE_URL = os.getenv('ADMIN_SERVICE_URL')
call_course_service = CallCourseService()

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
        # print('token:', token)
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the Firebase token
            decoded_token = firebase_auth.verify_id_token(token)
            # print('google:', decoded_token)
            email = decoded_token.get('email')
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
            # Get or create the user
            user, created = Profile.objects.get_or_create(
                email=email,
            )
            
            if not user.is_active:
                raise AuthenticationFailed(_("User is blocked"), code="user_blocked")

            # Generate JWT tokens
            # refresh = RefreshToken.for_user(user)
            refresh = CustomTokenObtainPairSerializer.get_token(user)
            access_token = refresh.access_token

            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
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
            is_profile_completed = profile.is_profile_completed
            # print("Received Data:", request.data)

        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data = {'message': 'user updated successfully'}
            if not is_profile_completed:
                refresh = CustomTokenObtainPairSerializer.get_token(profile)
                access_token = refresh.access_token
                response_data['refresh'] = str(refresh)
                response_data['access'] = str(access_token)
            return Response(response_data, status=status.HTTP_200_OK)
        
        print("Serializer Errors:", serializer.errors)  # Debugging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailsView(RetrieveAPIView):  # for anyone to see the profile details
    queryset = Profile.objects.all()
    serializer_class = ProfileDetailsSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

# used for fetching multiple users details - not only tutors.
class MultipleTutorDetailsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get the user_ids from query parameters
        user_ids = request.data.get('ids', None)
        print('user_ids:', user_ids)
        if not user_ids:
            return Response(
                {"error": "Please provide user IDs"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Convert string of ids (e.g., "1,2,3") to list of integers
            id_list = [id for id in user_ids]
        
            # Fetch profiles for all IDs
            profiles = Profile.objects.filter(pk__in=id_list)
            
            # Serialize the data
            serializer = ProfileDetailsSerializer(profiles, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {"error": "Invalid ID format. Please provide comma-separated integers"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Profile.DoesNotExist:
            return Response(
                {"error": "One or more users not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class SingleTutorDetailsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        print('here in single tutor details:', pk)
        try:
            user = Profile.objects.get(pk=pk)
            serializer = ProfileDetailsSerializer(user)
            try:
                response_course_service = call_course_service.get_tutor_course_details(pk)
            except CourseServiceException as e:
                # Handle user service exceptions and return appropriate error
                return Response({"error": str(e)}, status=503)
            except Exception as e:
                # Catch any unexpected exceptions
                return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

            course_data = response_course_service.json()
            data = serializer.data
            data['courses'] = course_data
            return Response(data, status=status.HTTP_200_OK)
        
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# def is_admin(user):
#     return AdminUser.objects.filter(profile=user).exists()

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

class AdminUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user =  request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            serializer = ProfileDetailsSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'error': f'Un expected error {e}'}, status=status.HTTP_404_NOT_FOUND)


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

        if not result['is_passed']:
            return Response({
                'badge_acquired': None,
                'aquired_mark': result['acquired_mark'],
                'is_passed': result['is_passed']
            }, status=status.HTTP_201_CREATED)

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

        if result['community'] and created:
            publish_chat_event(
                event_type='group_add',
                data={
                    'user_id': user.id,
                    'badge_title': result['title']
                }
            )

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

class DoesBadgeExistView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        print('inside DoesBadgeExistView', request.data)
        try:
            badge_id = request.data.get('badge_id')
            user_id = request.data.get('user_id')
            user = Profile.objects.get(id=user_id)
            return Response({"exists": user.badges_aquired.filter(badge_id=badge_id).exists()})
        except Profile.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        status_param = request.query_params.get('status', 'unread')  # Default is 'unread'
        
        if status_param == 'read':
            notifications = Notification.objects.read(user)
        else:
            notifications = Notification.objects.unread(user)

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        notification_id = request.data.get('notification_id')
        mark_all = request.data.get('mark_all', False)

        updated = None  # Initialize to avoid potential "referenced before assignment"

        if mark_all:
            updated = Notification.objects.mark_all_read(user)

        elif notification_id:
            updated = Notification.objects.mark_read(user, notification_id)

        else:
            return Response(
                {"error": "Either 'notification_id' or 'mark_all' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if updated:
            notifications = Notification.objects.read(user)
            serializer = NotificationSerializer(notifications, many=True)
            return Response(
                {"message": "Notification(s) marked as read", 'notifications': serializer.data},
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Notification not found"},
            status=status.HTTP_404_NOT_FOUND
        )

class WalletBalanceView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, id):
        try:
            user = Profile.objects.get(id=id)
            # wallet = user.wallet  # for now commented because lots of users without wallet exist
            wallet, created = Wallet.objects.get_or_create(user=user)
            serializer = WalletSerializer(wallet)
            if created:
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            print('wallet:', serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
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

# class AdminListAllReportsView(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):
#         print('inside get ::::')
#         user =  request.user
#         if not is_admin(user):
#             return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

#         try:
#             reports_response = call_course_service.get_all_reports()
#             reports = reports_response.json()
#             return Response(reports, status=status.HTTP_200_OK)

#         except CourseServiceException as e:
#             return Response({"error": str(e)}, status=503)
        
#         except Exception as e:
#             return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        filter_type = request.query_params.get('filter', 'all').lower()
        
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        time_filters = {
            'today': {'created_at__gte': today},
            'week': {'created_at__gte': week_start},
            'month': {'created_at__gte': month_start},
            'all': {}
        }

        filter_params = time_filters.get(filter_type, time_filters['all'])
        try:
            users = Profile.objects.filter()
            if filter_params:
                users = users.filter(**filter_params)
            active_users = users.filter(is_active=True).count()
            blocked_users = users.filter(is_active=False).count()

            return Response({'active_users': active_users, 'blocked_users': blocked_users}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)
