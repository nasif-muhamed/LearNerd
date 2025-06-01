from rest_framework import serializers
from django.utils import timezone
from .models import CommunityVideoMeeting

class CommunityVideoMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityVideoMeeting
        fields = '__all__'
        read_only_fields = ["id", "created_at", "room_id"]

    def validate(self, data):
        now = timezone.now()
        # Check for overlapping sessions if scheduled_time or duration_minutes is provided
        print('data::', data)
        scheduled_time = data.get('scheduled_time')
        if scheduled_time and scheduled_time < now:
            raise serializers.ValidationError("Scheduled time cannot be in the past.")
        return data
