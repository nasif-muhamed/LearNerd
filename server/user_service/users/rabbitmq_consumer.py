import pika
import json
import os
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from .models import Notification

Profile = get_user_model()
def callback(ch, method, properties, body):
    message = json.loads(body)
    routing_key = method.routing_key
    event_type = routing_key.split('.')[-1]  # e.g., 'purchase' from 'notification.course.purchase'
    print('inside callback:', message, routing_key)
    try:
        student_id = message['student_id']
        student = Profile.objects.get(id=student_id)
        tutor_id = message['tutor_id']
        tutor = Profile.objects.get(id=tutor_id)

        config = None
        if event_type == 'purchase':
            config = {
                'type': Notification.NotificationType.COURSE_PURCHASE,
                'message': f'{student.full_name_or_email} purchased your course "{message.get('course_title')}" with {message.get('purchase_type')} option'
            }

        if event_type == 'review':
            config = {
                'type': Notification.NotificationType.COURSE_REVIEW,
                'message': f"{student.full_name_or_email} rated your course {message.get('course_title')} {message.get('rating')} out of 5"
            }


        if config is None:
            print(f" [x] Unknown event type: {event_type}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Create notification
        Notification.objects.create(
            user=tutor,
            notification_type=config['type'],
            message=config['message'],
        )
        print(f" [x] Created notification for user {tutor}: {config['message']}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except User.DoesNotExist:
        print(f" [x] User {student_id} not found")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        print(f" [x] Error: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consumer():
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
    rabbitmq_pass = os.getenv('RABBITMQ_PASS', 'guest')
    print('rabbitmq, creds++++++++++++++++++++++:', rabbitmq_host, rabbitmq_user, rabbitmq_pass)

    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
    )
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'notification_events'
    channel.exchange_declare(exchange=exchange_name, exchange_type='topic', durable=True)

    # Declare queue
    queue_name = 'user_service_notifications'
    channel.queue_declare(queue=queue_name, durable=True)

    # Bind queue to exchange
    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name,
        routing_key='notification.course.*'
    )

    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print(' [*] Waiting for notification events...')
    channel.start_consuming()
