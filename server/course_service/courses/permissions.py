# course_service/permissions.py
from rest_framework import permissions
import requests
from rest_framework.exceptions import PermissionDenied
from django.conf import settings

class IsAdminUserCustom(permissions.BasePermission):
    message = "You must be an admin to access this resource."
    def has_permission(self, request, view):
        # print('in permissions')
        # Get the authentication token from the request header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return False

        ADMIN_SERVICE_URL = settings.ADMIN_SERVICE_URL
        
        try:
            response = requests.get(
                f'{ADMIN_SERVICE_URL}api/v1/admin/permission/',
                headers={
                    'Authorization': auth_header,
                    'Content-Type': 'application/json'
                },
                timeout=5  # Add timeout to prevent hanging
            )
            
            # Check if response is successful and user is admin
            if response.status_code == 200:
                data = response.json()
                return data.get('is_admin', False)
            else:
                return False
                
        except requests.RequestException:
            # Handle connection errors or timeouts
            raise PermissionDenied("Unable to verify admin status from admin service")


# Custom permission to allow access only to users whose profile is completed.
class IsProfileCompleted(permissions.BasePermission):
    message = "You must complete your profile to access this resource."
    def has_permission(self, request, view):
        # print('in IsProfileCompleted')
        user_payload = request.user_payload
        # print('user_payload:', user_payload)
        if user_payload is not None and user_payload.get('is_profile_completed', False):
            return True
        return False
                
class IsUser(permissions.BasePermission):
    message = "You must be a user to access this resource."
    def has_permission(self, request, view):
        # print('in IsUser')
        user_payload = request.user_payload
        # print('user_payload:', user_payload)
        if user_payload is not None:
            return True
        return False
    
class IsUserTutor(permissions.BasePermission):
    pass