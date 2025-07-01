from datetime import timedelta
from django.utils import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Purchase, VideoSession
from . rabbitmq_publisher import publish_chat_event, publish_notification_event

def chat_expiry_date(days):
    # Calculate the expiry date based on the number of days
    expiry_date = timezone.now() + timezone.timedelta(days=days)
    return expiry_date.isoformat()


@receiver(post_save, sender=Purchase)
def handle_purchase_created(sender, instance, created, **kwargs):
    if created:
        if instance.purchase_type == 'subscription' and instance.chat_upto:
            expiry_date = chat_expiry_date(instance.chat_upto)
            publish_chat_event(
                event_type='create_chat_room',
                data={
                    'student_id': instance.user,
                    'tutor_id': instance.course.instructor,
                    'expiry_date': expiry_date,
                }
            )
            
@receiver(pre_save, sender=Purchase)
def handle_purchase_update(sender, instance, **kwargs):
    if not instance.pk:
        # New purchase being created, skip. What I want is to updation of the purchase.
        return

    try:
        old_instance = Purchase.objects.get(pk=instance.pk)
    except Purchase.DoesNotExist:
        return

    # Compare fields
    old_purchase_type = old_instance.purchase_type
    new_purchase_type = instance.purchase_type

    # Only continue if the purchase is completed in the new version
    if old_purchase_type == 'freemium' and new_purchase_type == 'subscription' and instance.chat_upto:
        expiry_date = chat_expiry_date(instance.chat_upto)
        publish_chat_event(
            event_type='create_chat_room',
            data={
                'student_id': instance.user,
                'tutor_id': instance.course.instructor,
                'expiry_date': expiry_date,
            }
        )

@receiver(pre_save, sender=VideoSession)
def handle_video_session_update(sender, instance, **kwargs):
    if not instance.pk:
        if instance.status == 'pending':
            publish_chat_event(
                event_type='update_temp_chat',
                data={
                    'student_id': instance.student,
                    'tutor_id': instance.tutor,
                    'temporary': True
                }
            )

            publish_notification_event(
                event_type='course.video_sesssion.request',
                data={
                    'student_id': instance.student,
                    'tutor_id': instance.tutor,
                    'course_title': instance.purchase.course.title,
                }
            )

    else:
        if instance.status == 'approved':
            publish_notification_event(
                event_type='course.video_sesssion.approved',
                data={
                    'student_id': instance.student,
                    'tutor_id': instance.tutor,
                    'course_title': instance.purchase.course.title,
                    'scheduled_time': instance.scheduled_time.isoformat()
                }
            )

        elif instance.status == 'completed':
            publish_chat_event(
                event_type='update_temp_chat',
                data={
                    'student_id': instance.student,
                    'tutor_id': instance.tutor,
                    'temporary': False
                }
            )


