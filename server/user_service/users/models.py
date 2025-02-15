from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class ProfileManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user


class Profile(AbstractBaseUser):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    biography = models.TextField(max_length=1000, blank=True, null=True)
    image = models.ImageField(upload_to='user/profile/images', null=True, blank=True)
    is_tutor = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProfileManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class AdminUser(models.Model):
    profile = models.ForeignKey(Profile, related_name="admins", on_delete=models.CASCADE)
    username = models.CharField(max_length=100)