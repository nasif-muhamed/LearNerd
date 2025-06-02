import uuid
from django.db import models
from django.utils import timezone

class CommunityVideoMeeting(models.Model):
    title = models.CharField(max_length=255)
    scheduler = models.BigIntegerField(db_index=True)
    badge = models.BigIntegerField(db_index=True)
    badge_name = models.CharField(max_length=255)
    room_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    scheduled_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.room_id} - {self.tutor} with {self.student}"
