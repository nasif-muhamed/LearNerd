from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Badges
from .message_broker.rabbitmq_publisher import publish_chat_event

@receiver(pre_save, sender=Badges)
def handle_badge_updation(sender, instance, **kwargs):
    if not instance.pk: # if new instance, skip.
        return
    old_instance = Badges.objects.get(pk=instance.pk)
    print(f"Signals +++++ New title for {old_instance.title} as {instance.title}")
    if instance.community and old_instance.title != instance.title:
        publish_chat_event(
            event_type='update_group_name',
            data={
                'old_title': old_instance.title,
                'new_title': instance.title,
            }
        )
