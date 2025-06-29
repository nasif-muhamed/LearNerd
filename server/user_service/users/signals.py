from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Notification, Profile, Wallet
from .message_broker.rabbitmq_publisher import publish_notification_event, publish_chat_event

@receiver(post_save, sender=Notification)
def handle_notification_created(sender, instance, created, **kwargs):
    if created:
        publish_notification_event(
            event_type='send',
            data={
                'user_id': instance.user.id,
                'message': instance.message,
                'notification_type': instance.notification_type,
                'created_at': instance.created_at.isoformat(),
            }
        )

@receiver(post_save, sender=Profile)
def wallet_creation_on_user_join(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance, balance=0.00)

@receiver(post_save, sender=Profile)
def handle_profile_update(sender, instance, created, **kwargs):
    # Only continue if the profile is completed in the new version
    if instance.is_profile_completed:
        publish_chat_event(
            event_type='profile_updated',
            data={
                'user_id': instance.id,
                'email': instance.email,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'image_url': instance.image.url if instance.image else None,
            }
        )

