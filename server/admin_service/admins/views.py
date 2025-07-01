import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

from . models import AdminUser
from . serializers import AdminUserSerializer
from . utils import CallUserService, UserServiceException, CallCourseService, CourseServiceException
from . auth_utils import generate_and_send_otp, verify_otp_and_generate_tokens

logger = logging.getLogger(__name__)
call_user_service = CallUserService()
call_course_service = CallCourseService()

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            username = request.data.get('username')
            if not username:
                return Response(
                    {'error': 'Username is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = AdminUser.objects.get(username=username)
            if user is not None and user.is_superuser:
                return generate_and_send_otp(user, username)
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        except Exception as e:
            logger.exception(f"Unexpected error during login for username '{request.data.get('username')}': {e}")
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
                    {'error': 'OTP, username, and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return verify_otp_and_generate_tokens(request, username, password, otp)

        except Exception as e:
            logger.exception(f"OTP verification failed for username '{request.data.get('username')}': {e}")
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
            logger.error(f"Admin user with ID {pk} not found.")
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
            logger.error(f"Error fetching user with ID {pk}: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error fetching user with ID {pk}: {e}")
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
            logger.error(f"Error blocking user with ID {pk}: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error blocking user with ID {pk}: {e}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        

class UserListView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        """
        Fetch list of users
        Supports query parameters for filtering/pagination if given
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
            logger.error(f"Error fetching users: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error fetching users: {e}")
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
            logger.error(f"Error fetching notifications: {e}")            
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error fetching notifications: {e}")            
            return Response(
                {"error": "An unexpected error occurred while fetching notifications"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminListReportsAPIView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        try:
            query_params = request.GET.urlencode()
            course_service_response = call_course_service.get_all_reports(
                request= request,
                query_params=query_params if query_params else None
            )
            
            reports_response = course_service_response.json()
            reports = reports_response.get('results', [])
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
                report['user'] = users_dict.get(student, {})
                report['instructor'] = users_dict.get(instructor, {})

            reports_response['results'] = reports

            return Response(
                reports_response,
                status=course_service_response.status_code
            )

        except CourseServiceException as e:
            logger.error(f"Course Service Error fetching reports: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            logger.error(f"User Service Error fetching users: {e}")
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception(f"Unexpected error fetching users: {e}")
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
            logger.error(f"Course Service Error updating report with ID {pk}: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error updating report with ID {pk}: {e}")
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
            courses_response = call_course_service.get_dashboard_data(
                request=request,
                query_params=query_params if query_params else None
            )
            courses_data = courses_response.json()

            return Response({**users_data, **courses_data}, status=status.HTTP_200_OK )

        except CourseServiceException as e:
            logger.error(f"Course Service Error fetching dashboard data: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except UserServiceException as e:
            logger.error(f"User Service Error fetching dashboard data: {e}")
            return Response(
                {'error': f'User service error: {str(e)}'},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception(f"Unexpected error fetching dashboard data: {e}")
            return Response(
                {"error": f"An unexpected error occurred while fetching dashboard data: {str(e)}"},
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
            logger.error(f"Course Service Error fetching dashboard chart data: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error fetching dashboard chart data: {e}")
            return Response(
                {"error": f"An unexpected error occurred while fetching dashboard chart data: {str(e)}"},
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
            logger.error(f"Course Service Error fetching transactions: {e}")
            return Response(
                {"error": str(e.detail)},
                status=e.status_code if hasattr(e, 'status_code') else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error fetching transactions: {e}")
            return Response(
                {"error": f"An unexpected error occurred while fetching transactions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
