from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CommunityVideoMeeting
from courses.rabbitmq_publisher import publish_chat_event

@receiver(post_save, sender=CommunityVideoMeeting)
def handle_meeting_created(sender, instance, created, **kwargs):
    if created:
        print(f"Signals +++++ New meeting by {instance.scheduler} for {instance.badge}")
        publish_chat_event(
            event_type='create_community_meeting',
            data={
                'badge_name': instance.badge_name,
                'title': instance.title,
                'scheduled_time': instance.scheduled_time.isoformat(),
            }
        )
