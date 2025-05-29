from .models import AdminUser

def is_admin(user):
    return AdminUser.objects.filter(profile=user).exists()
