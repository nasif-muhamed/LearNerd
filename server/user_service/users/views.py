import logging
import time
import os
import requests
from django.core.cache import cache
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
from rest_framework import generics
from rest_framework.exceptions import AuthenticationFailed

from . firebase_auth import auth as firebase_auth
from . models import BadgesAquired, Notification, Wallet
from . serializers import RegisterSerializer, ProfileSerializer, CustomTokenObtainPairSerializer, UserActionSerializer, \
    BadgesAquiredSerializer, BadgeSerializer, ForgotPasswordSerializer, ForgotPasswordOTPVerifySerializer, ForgotPasswordResetSerializer, \
    ProfileDetailsSerializer, NotificationSerializer, WalletSerializer
from .services import CallCourseService, CourseServiceException
from .message_broker.rabbitmq_publisher import publish_chat_event
from .utils import is_admin, generate_and_send_otp, verify_otp, handle_otp_resend, send_forgot_password_otp, get_cache_key, CustomPagination

logger = logging.getLogger(__name__)
Profile = get_user_model()
ADMIN_SERVICE_URL = os.getenv('ADMIN_SERVICE_URL')
call_course_service = CallCourseService()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp, _ = generate_and_send_otp(email)
            cache_data = {
                'otp': otp,
                'data': serializer.validated_data,
                'last_sent': time.time(),
            }
            cache.set(email, cache_data, timeout=180)  # 3 minutes expiry
            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
        
        logger.warning("RegisterView: Invalid registration data: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        verified, result = verify_otp(email, otp)
        if not verified:
            return Response({'detail': result}, status=status.HTTP_400_BAD_REQUEST)

        cache_data = result
        serializer = RegisterSerializer(data=cache_data['data'])
        if serializer.is_valid():
            user = serializer.save()
            cache.delete(email)
            return Response({'message': 'User registered successfully', 'id': user.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        flow = request.data.get('flow')  # Expected to be either 'register' or 'forgot_password'

        if not email or not flow:
            return Response({'detail': 'Email and flow are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if flow not in ['register', 'forgot_password']:
            return Response({'detail': 'Invalid flow. Must be "register" or "forgot_password".'}, status=status.HTTP_400_BAD_REQUEST)

        cache_data, error = handle_otp_resend(email, flow)
        if error:
            logger.warning("ResendOTPView: Error resending OTP for %s, flow=%s, cache_data=%s", email, flow, cache_data)
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'New OTP sent successfully'}, status=status.HTTP_200_OK)

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')  # Firebase ID token from frontend
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded_token = firebase_auth.verify_id_token(token)  # Verify the Firebase token
            email = decoded_token.get('email')
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
            user, created = Profile.objects.get_or_create(
                email=email,
            )
            if not user.is_active:
                raise AuthenticationFailed(_("User is blocked"), code="user_blocked")

            refresh = CustomTokenObtainPairSerializer.get_token(user)
            access_token = refresh.access_token
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
                'registered': created,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error("GoogleLoginView: Invalid Firebase token for request: %s", str(e), exc_info=True)
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            send_forgot_password_otp(email)
            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            verified, result = verify_otp(email, otp, flow='forgot_password')
            if not verified:
                return Response({'detail': result}, status=status.HTTP_400_BAD_REQUEST)

            cache_key = get_cache_key(email, 'forgot_password')
            cache_data = cache.get(cache_key)
            cache_data['otp_verified'] = True
            cache.set(cache_key, cache_data, timeout=180)
            return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            cache_key = get_cache_key(email, 'forgot_password')
            cache_data = cache.get(cache_key)

            if not cache_data or not cache_data.get('otp_verified'):
                logger.warning("ForgotPasswordResetView: OTP not verified for %s", email)
                return Response({'detail': 'OTP verification required. Please verify OTP first.'}, status=status.HTTP_400_BAD_REQUEST)

            user = Profile.objects.get(email=email)
            if user.check_password(password):
                return Response({'detail': 'New password cannot be the same as the current password.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(password)
            user.save()
            cache.delete(cache_key)
            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        try:
            logger.info(f'user logger tester: {request.user.email}')
            profile = request.user
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)

        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            profile = request.user
            is_profile_completed = profile.is_profile_completed

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
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailsView(RetrieveAPIView):  # for anyone to see the profile details
    queryset = Profile.objects.all()
    serializer_class = ProfileDetailsSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

class MultipleTutorDetailsView(APIView): # used for fetching multiple users details - not only tutors.
    permission_classes = [AllowAny]

    def get(self, request):
        user_ids = request.data.get('ids', None)
        if not user_ids:
            return Response(
                {"error": "Please provide user IDs"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            id_list = [int(id) for id in user_ids]
            profiles = Profile.objects.filter(pk__in=id_list)            
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
        try:
            user = Profile.objects.get(pk=pk)
            serializer = ProfileDetailsSerializer(user)
            response_course_service = call_course_service.get_tutor_course_details(pk)
            course_data = response_course_service.json()
            data = serializer.data
            data['courses'] = course_data
            return Response(data, status=status.HTTP_200_OK)
        
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except CourseServiceException as e:
            logger.error("SingleTutorDetailsView: Course service failed for tutor %s: %s", pk, str(e))
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

class UserActionView(APIView):  # Admin specific view.
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
        user =  request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_to_modify = Profile.objects.get(pk=pk)
            if is_admin(user_to_modify):
                logger.warning("UserActionView: Attempted to block admin by user %s", request.user.id)
                return Response({'error': 'You should not block admin'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
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
            
            users = Profile.objects.all()

            # Apply search, filtering, sorting, pagination
            search_query = request.query_params.get('search', None)
            if search_query:
                users = users.filter(
                    Q(email__icontains=search_query) |
                    Q(first_name__icontains=search_query) |
                    Q(last_name__icontains=search_query)
                )

            is_tutor = request.query_params.get('is_tutor', None)
            if is_tutor is not None:
                users = users.filter(is_tutor=is_tutor.lower() == 'true')
            is_active = request.query_params.get('is_active', None)
            if is_active is not None:
                users = users.filter(is_active=is_active.lower() == 'true')

            ordering = request.query_params.get('ordering', '-created_at')
            allowed_ordering = ['created_at', '-created_at', 'is_active', '-is_active']
            if ordering in allowed_ordering:
                users = users.order_by(ordering)
            else:
                users = users.order_by('-created_at')  # Default sorting

            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)

            serializer = ProfileSerializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)

        except Profile.DoesNotExist:
            return Response(
                {'error': 'Users not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            logger.exception("UsersView: Unexpected error while fetching users")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MyBadgesView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]

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
        try:
            response = requests.post(
                badge_service_url,
                json={'badge_id': badge_id, 'answers': answers},
                timeout=5
            )
            response.raise_for_status()
            result = response.json()
        except requests.RequestException as e:
            logger.error("SubmitQuizView: Failed to connect to admin_service: %s", str(e), exc_info=True)
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

        badge_acquired, created = BadgesAquired.objects.get_or_create(
            profile=user,
            badge_id=badge_id,
            defaults={
                'badge_title': result['title'],
                'badge_image': result['image'],
                'total_questions': result['total_questions'],
                'pass_mark': result['pass_mark'],
                'aquired_mark': result['acquired_mark'],
                'attempts': 1
            }
        )

        if result['community'] and created:
            publish_chat_event(
                event_type='group_add',
                data={
                    'user_id': user.id,
                    'badge_title': result['title']
                }
            )

        if not created:
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
        status_param = request.query_params.get('status', 'unread')
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
        updated = None

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
            wallet, created = Wallet.objects.get_or_create(user=user)
            serializer = WalletSerializer(wallet)
            if created:
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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
