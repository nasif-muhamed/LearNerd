from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import CommunityVideoMeeting
from courses.rabbitmq_publisher import publish_chat_event

@receiver(post_save, sender=CommunityVideoMeeting)
def handle_meeting_created(sender, instance, created, **kwargs):
    if created:
        publish_chat_event(
            event_type='create_community_meeting',
            data={
                'meeting_id': instance.id,
                'badge_name': instance.badge_name,
                'title': instance.title,
                'scheduled_time': instance.scheduled_time.isoformat(),
                'status': instance.status,
            }
        )

@receiver(pre_save, sender=CommunityVideoMeeting)
def handle_meeting_update(sender, instance, **kwargs):
    if instance.pk: # if not new meeting being created.
        data={
            'meeting_id': instance.id,
            'badge_name': instance.badge_name,
            'title': instance.title,
            'status': instance.status,
        }
        if instance.status == 'cancelled' or instance.status == 'completed':
            publish_chat_event(
                event_type='delete_community_meeting',
                data=data
            )
        elif instance.status == 'in_progress':
            publish_chat_event(
                event_type='update_community_meeting',
                data=data
            )
