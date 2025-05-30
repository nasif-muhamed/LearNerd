from django.db import models
from cloudinary.models import CloudinaryField


class Badges(models.Model):
    title = models.CharField(max_length=150, unique=True)
    description = models.TextField(max_length=1000)
    image = CloudinaryField('image', null=True, blank=True)
    community = models.BooleanField(default=True)
    total_questions = models.PositiveIntegerField(default=10)
    pass_mark = models.PositiveIntegerField(default=7)
    is_active = models.IntegerField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Questions(models.Model):
    badge_id = models.ForeignKey(Badges, related_name='questions', on_delete=models.CASCADE)
    question = models.TextField(max_length=1000)
    order = models.IntegerField()


class Answers(models.Model):
    OPTION_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
    ]
    question_id = models.ForeignKey(Questions, related_name='answers', on_delete=models.CASCADE)
    options = models.CharField(max_length=1, choices=OPTION_CHOICES)
    answer = models.TextField(max_length=1000)
    is_correct = models.BooleanField()
