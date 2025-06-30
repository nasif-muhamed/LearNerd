from rest_framework import permissions

class IsUserAdmin(permissions.BasePermission):
    message = "You must be an admin to access this resource."
    def has_permission(self, request, view):
        user_payload = request.user_payload
        if user_payload is not None and user_payload.get('is_admin', False):
            return True
        return False
