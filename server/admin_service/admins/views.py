import requests
import json
import random

from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
# from rest_framework_simplejwt.views import TokenObtainPairView

from . models import AdminUser, UserServiceToken
from . serializers import AdminUserSerializer
from . utils import CallUserService, UserServiceException


call_user_service = CallUserService()


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            # password = request.data.get('password') 
            
            if not username:
                return Response(
                    {'error': 'Username and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # user = authenticate(request, username=username, password=password)
            user = AdminUser.objects.get(username=username)
            if user is not None and user.is_superuser:
                # Generate 4-digit OTP
                otp = ''.join([str(random.randint(0, 9)) for _ in range(4)])
                print('otp:', otp)
                # Store OTP and username in cache with 2 minute timeout
                cache_key = f"otp_{username}"
                cache.set(cache_key, otp, timeout=120)

                # try:
                #     send_mail(
                #         subject='Your OTP Code',
                #         message=f'Your OTP is {otp}. It will expire in 1 minute.',
                #         from_email=settings.DEFAULT_FROM_EMAIL,
                #         recipient_list=[user.email],
                #         fail_silently=False,
                #     )

                # except Exception as email_error:
                #     return Response(
                #         {'error': f'Failed to send OTP: {str(email_error)}'},
                #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
                #     )
                
                return Response(
                    {'message': 'OTP sent to your email'},
                    status=status.HTTP_200_OK
                )

            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            otp = request.data.get('otp')
            if not username or not otp or not password:
                return Response(
                    {'error': 'OTP and Password are required '},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get stored OTP from cache
            cache_key = f"otp_{username}"
            stored_otp = cache.get(cache_key)
            if stored_otp is None:
                return Response(
                    {'error': 'OTP has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if stored_otp == otp:
                # OTP is valid, get user and generate tokens
                user = authenticate(request, username=username, password=password)
                if user is not None and user.is_superuser:
                    refresh = RefreshToken.for_user(user)
                    # Clear OTP from cache after successful verification
                    cache.delete(cache_key)

                    method = request.method 
                    data = {
                        'email': user.email,
                        'password': password
                    }
                    user_response = call_user_service.get_tokens(method, data)

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

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            user = AdminUser.objects.get(pk=pk)
            serializer = AdminUserSerializer(user)
            return Response(serializer.data)
        
        except AdminUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

class AdminUserActionView(APIView):
    permission_classes = [IsAdminUser]
    
    def patch(self, request, pk):
        # Blocking a single user
        try:
            response = call_user_service.block_user(
                pk=pk,
                method=request.method,
                data=request.data,
                admin=request.user
            )
            
            return Response(
                response.json(),
                status=response.status_code
            )

        except UserServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        


class UserListView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Fetch list of users
        Supports query parameters for filtering/pagination if provided
        """
        try:
            # Get query parameters from request
            query_params = request.query_params.dict()
            
            response = call_user_service.get_users(
                admin=request.user,
                query_params=query_params if query_params else None
            )
            
            return Response(
                response.json(),
                status=response.status_code
            )

        except UserServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred while fetching users"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class AdminAuthView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({'message':'Permission accessed'})
