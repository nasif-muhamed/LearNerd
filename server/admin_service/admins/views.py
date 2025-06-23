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
from . utils import CallUserService, UserServiceException, CallCourseService, CourseServiceException


call_user_service = CallUserService()
call_course_service = CallCourseService()


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
                    # user_response = call_user_service.get_tokens(method, data)

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

    def get(self, request, pk):
        try:
            response = call_user_service.get_user(
                pk=pk,
                admin=request.user,
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
            query_params = request.GET.urlencode()
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

# to get all notification related to the admin
class AdminNotificationView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get query parameters from request
            query_params = request.GET.urlencode()
            response = call_user_service.get_my_notifications(
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

class AdminListReportsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            print('AdminListReportsPIView')
            # Get query parameters from request
            query_params = request.GET.urlencode()
            course_service_response = call_course_service.get_all_reports(
                request= request,
                query_params=query_params if query_params else None
            )
            
            reports_response = course_service_response.json()
            reports = reports_response.get('results', [])
            # print('reports:', reports)
            ids = set()
            for report in reports:
                student = report['user']
                instructor = report['instructor']
                if student not in ids:
                    ids.add(student)
                if instructor not in ids:
                    ids.add(instructor)

            user_service_response = call_user_service.get_users_details(list(ids))
            users = user_service_response.json()
            users_dict = {user['id']: user for user in users}
            for report in reports:
                student = report['user']
                instructor = report['instructor']
                print('instructor:', instructor)
                report['user'] = users_dict.get(student, {})
                report['instructor'] = users_dict.get(instructor, {})

            reports_response['results'] = reports

            return Response(
                reports_response,
                status=course_service_response.status_code
            )

        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred while fetching users: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminReportActionAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            response = call_course_service.update_report(
                request=request,
                pk=pk,
                method=request.method,
                data=request.data
            )
            
            return Response(
                response.json(),
                status=response.status_code
            )

        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminAuthView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({'message':'Permission accessed', 'is_admin': True}, status=status.HTTP_200_OK)

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            query_params = request.GET.urlencode()
            users_response = call_user_service.get_dashboard_data(
                admin=request.user,
                query_params=query_params if query_params else None
            )
            users_data = users_response.json()
            print('users_sata;', users_data)
            courses_response = call_course_service.get_dashboard_data(
                request=request,
                query_params=query_params if query_params else None
            )
            courses_data = courses_response.json()

            return Response({**users_data, **courses_data}, status=status.HTTP_200_OK )

        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred while fetching users: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminDashboardChartView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            query_params = request.GET.urlencode()
            courses_response = call_course_service.get_dashboard_chart_data(
                request=request,
                query_params=query_params if query_params else None
            )
            courses_data = courses_response.json()

            return Response(courses_data, status=status.HTTP_200_OK )

        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred while fetching users: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminTransactionsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            query_params = request.GET.urlencode()
            transactions_response = call_course_service.get_admin_transactions(
                request=request,
                query_params=query_params if query_params else None
            )
            transactions_data = transactions_response.json()

            return Response(transactions_data, status=status.HTTP_200_OK)

        except CourseServiceException as e:
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred while fetching users: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
