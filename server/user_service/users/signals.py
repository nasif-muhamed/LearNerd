from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification

@receiver(post_save, sender=Notification)
def handle_notification_created(sender, instance, created, **kwargs):
    if created:
        print(f"New notification ({instance.notification_type}) for {instance.user.first_name}: {instance.message}")
        # Example: Send push notification or websocket update