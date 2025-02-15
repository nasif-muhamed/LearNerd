import requests
import os
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

from . models import AdminUser
from . serializers import AdminUserSerializer


class AdminView(APIView):
    permission_class = [IsAdminUser]
    
    def get(self, request, pk):
        try:
            user = AdminUser.objects.get(pk=pk)
            serializer = AdminUserSerializer(user)
            return Response(serializer.data)
        
        except AdminUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

class AdminUserActionView(APIView):
    permission_class = [IsAdminUser]
    
    def patch(self, request, pk):
        try:
            user_auth_token = request.headers.get('UserAuthorization')
            if user_auth_token is None:
                return Response({"error": "Authorization token for user side is needed"}, status=400)

            headers = {
                'Authorization': user_auth_token  # Pass the token in the headers to the user service
            }
            body = request.data
            user_response = requests.patch(
                f"http://localhost:8001/api/users/user-action/{pk}/", 
                headers=headers,
                json=body
            )
            
            return Response(user_response.json(), status=user_response.status_code)

        except requests.RequestException as e:
            return Response({"error": str(e)}, status=500)
        

