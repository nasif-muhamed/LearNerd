from django.contrib.auth.models import AbstractUser
from django.db import models

class AdminUser(AbstractUser):
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=15, unique=True)


class UserServiceToken(models.Model):
    admin = models.OneToOneField(AdminUser, on_delete=models.CASCADE)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
