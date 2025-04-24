from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .message_broker.rabbitmq_publisher import publish_notification_event

@receiver(post_save, sender=Notification)
def handle_notification_created(sender, instance, created, **kwargs):
    if created:
        print(f"Signals +++++ New notification ({instance.notification_type}) for {instance.user.first_name}: {instance.message}")
        publish_notification_event(
            event_type='send',
            data={
                'user_id': instance.user.id,
                'message': instance.message,
                'notification_type': instance.notification_type,
                'created_at': instance.created_at.isoformat(),
            }
        )
