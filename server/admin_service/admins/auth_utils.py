import random
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserServiceToken
from .utils import CallUserService, UserServiceException

logger = logging.getLogger(__name__)
call_user_service = CallUserService()

def generate_and_send_otp(user, username):
    """Generate and send OTP to user's email."""
    try:
        # Generate 4-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        logger.info(f'admin otp: {otp}, {user.email}')
        # Store OTP and username in cache with 2 minute timeout
        cache_key = f"otp_{username}"
        cache.set(cache_key, otp, timeout=120)
        
        send_mail(
            subject='Your OTP Code',
            message=f'Your OTP is {otp}. It will expire in 1 minute.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return Response(
            {'message': 'OTP sent to your email'},
            status=status.HTTP_200_OK
        )

    except Exception as email_error:
        logger.error(f"Failed to send OTP to {user.email}: {str(email_error)}")
        return Response(
            {'error': f'Failed to send OTP: {str(email_error)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def verify_otp_and_generate_tokens(request, username, password, otp):
    """Verify OTP and generate authentication tokens."""
    # Get stored OTP from cache
    cache_key = f"otp_{username}"
    stored_otp = cache.get(cache_key)
    if stored_otp is None:
        return Response(
            {'error': 'OTP has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_otp == otp:
        # OTP is valid, authenticate user and generate tokens
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_superuser:
            refresh = RefreshToken.for_user(user)
            cache.delete(cache_key)  # Clear OTP from cache
            
            method = request.method
            data = {
                'email': user.email,
                'password': password
            }
            
            try:
                user_response = call_user_service.get_tokens(method, data)
                user_data = user_response.json()
                UserServiceToken.objects.update_or_create(
                    admin=user,
                    defaults={
                        "access_token": user_data.get('access'),
                        "refresh_token": user_data.get('refresh')
                    }
                )

                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user_access': user_data.get('access'),
                    'user_refresh': user_data.get('refresh'),
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)

            except UserServiceException as e:
                return Response(
                    {'error': f'User service error: {str(e)}'},
                    status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
                )
            
            except Exception as e:
                return Response(
                    {'error': f'An unexpected error occurred: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        else:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        return Response(
            {'error': 'Invalid OTP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    