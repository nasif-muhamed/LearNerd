import pika
import json
import os
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chats.service import (create_or_update_user, create_or_update_chat_room, create_or_update_group_chat_room, 
                           add_to_group_chat, update_group_chat_name, create_group_meeting, delete_group_meeting, update_group_meeting)

logger = logging.getLogger(__name__)

def notification_callback(ch, method, properties, body):
    body = json.loads(body)
    routing_key = method.routing_key
    try:
        user_id = body['user_id']
        message = body['message']
        notification_type = body['notification_type']
        created_at = body['created_at']

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{user_id}',
            {
                'type': 'send_notification',
                'message': message,
                'notification_type': notification_type,
                'created_at': created_at,
            }
        )


        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logger.exception(f" [x] Unexpected error while processing notification event: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def chat_callback(ch, method, properties, body):
    body = json.loads(body)
    routing_key = method.routing_key
    routing_key_arr = routing_key.split('.')
    event_type = '.'.join(routing_key_arr[1:])
    try:
        if event_type == 'profile_updated':
            user_id = body['user_id']
            email = body['email']
            first_name = body['first_name']
            last_name = body['last_name']
            image_url = body['image_url']

            user, created = create_or_update_user(user_id, email, first_name, last_name, image_url)
            if user is None:
                raise Exception("Failed to create or update user")
            
        elif event_type == 'create_chat_room':
            student_id = body['student_id']
            tutor_id = body['tutor_id']
            expiry_date = body['expiry_date']
            room, _ = create_or_update_chat_room(student_id, tutor_id, expiry_date)
            if room is None:
                raise Exception("Failed to create chat room")
            
        elif event_type == 'update_temp_chat':
            student_id = body['student_id']
            tutor_id = body['tutor_id']
            temporary = body['temporary']
            room, _ = create_or_update_chat_room(student_id, tutor_id, None, temporary)
            if room is None:
                raise Exception("Failed to update temporary chat")

        elif event_type == 'create_group_chat_room':
            name = body['name']
            image = body['image']
            admin = body['admin']
            room, _ = create_or_update_group_chat_room(name, image, admin)
            if room is None:
                raise Exception("Failed to create or update group chat room")
    
        elif event_type == 'group_add':
            user_id = body['user_id']
            badge_title = body['badge_title']
            room, _ = add_to_group_chat(user_id, badge_title)
            if room is None:
                raise Exception("Failed to add user to group chat")

        elif event_type == 'update_group_name':
            old_title = body['old_title']
            new_title = body['new_title']
            room = update_group_chat_name(old_title, new_title)
            if room is None:
                raise Exception("Failed to update group name")

        elif event_type == 'create_community_meeting':
            badge_name = body['badge_name']
            meeting_id = body['meeting_id']
            title = body['title']
            scheduled_time = body['scheduled_time']
            status = body['status']
            meeting = create_group_meeting(meeting_id, badge_name, title, scheduled_time, status)

        elif event_type == 'delete_community_meeting':
            meeting_id = body['meeting_id']
            badge_name = body['badge_name']
            title = body['title']
            status = body['status']
            delete_group_meeting(meeting_id, badge_name, title, status)

        elif event_type == 'update_community_meeting':
            meeting_id = body['meeting_id']
            badge_name = body['badge_name']
            title = body['title']
            status = body['status']
            update_group_meeting(meeting_id, badge_name, title, status)


        logger.info(f" [x] chat event received: {event_type}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logger.exception(f" [x] Unexpected error while processing chat event: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
    rabbitmq_pass = os.getenv('RABBITMQ_PASS', 'guest')

    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
    )
    channel = connection.channel()

    # Declare exchanges
    notification_exchange_name = 'notification_events'
    channel.exchange_declare(exchange=notification_exchange_name, exchange_type='topic', durable=True)

    chat_exchange_name = 'chat_events'
    channel.exchange_declare(exchange=chat_exchange_name, exchange_type='topic', durable=True)

    # Declare queues
    notification_queue_name = 'channel_service_notification_send'
    channel.queue_declare(queue=notification_queue_name, durable=True)

    chat_queue_name = 'channel_service_chat'
    channel.queue_declare(queue=chat_queue_name, durable=True)

    # Bind queue to exchange
    channel.queue_bind(
        exchange=notification_exchange_name,
        queue=notification_queue_name,
        routing_key='notification.send'
    )

    channel.queue_bind(
        exchange=chat_exchange_name,
        queue=chat_queue_name,
        routing_key='chat.#'
    )

    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=notification_queue_name, on_message_callback=notification_callback)
    channel.basic_consume(queue=chat_queue_name, on_message_callback=chat_callback)

    logger.info(' [*] Waiting for notification events...')
    channel.start_consuming()
