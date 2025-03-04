import pyotp
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination

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
            print(message)
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

    def get(self, request, pk):
        user =  request.user
        if not is_admin(user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user_to_fetch = Profile.objects.get(pk=pk)
            serializer = UserActionSerializer(user_to_fetch)
            return Response(serializer.data)
        
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

        serializer = UserActionSerializer(user_to_modify, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User status updated successfully', 'data': serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from urllib.parse import urlencode
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