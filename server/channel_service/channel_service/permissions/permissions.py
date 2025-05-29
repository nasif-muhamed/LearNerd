from rest_framework import permissions

class IsUserAdmin(permissions.BasePermission):
    message = "You must be an admin to access this resourse."
    def has_permission(self, request, view):
        # print('in IsProfileCompleted')
        user_payload = request.user_payload
        print('channel_service user_payload:', user_payload)
        # print('user_payload:', user_payload)
        if user_payload is not None and user_payload.get('is_admin', False):
            return True
        return False
