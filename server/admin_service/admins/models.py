from django.contrib.auth.models import AbstractUser
from django.db import models

class AdminUser(AbstractUser):
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=15, unique=True)