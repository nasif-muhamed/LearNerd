from django.db import models
from cloudinary.models import CloudinaryField

class HomeBanner(models.Model):
    banner = CloudinaryField('image', null=True, blank=True)
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField(max_length=1000)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AdBanner(models.Model):
    banner = CloudinaryField('image', null=True, blank=True)
    title = models.CharField(max_length=200, unique=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AdVideo(models.Model):
    video = CloudinaryField('video', resource_type='video', null=True, blank=True)
    title = models.CharField(max_length=200, unique=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
