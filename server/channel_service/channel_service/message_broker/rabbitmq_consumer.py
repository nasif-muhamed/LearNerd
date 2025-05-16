import pika
import json
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chats.service import create_or_update_user, create_or_update_chat_room

def notification_callback(ch, method, properties, body):
    body = json.loads(body)
    routing_key = method.routing_key
    print('inside notification_callback:', body, routing_key)
    try:
        user_id = body['user_id']
        message = body['message']
        notification_type = body['notification_type']
        created_at = body['created_at']

        channel_layer = get_channel_layer()
        print('before sending websocket @@@@@@@@@@@@@@@@')
        async_to_sync(channel_layer.group_send)(
            f'user_{user_id}',
            {
                'type': 'send_notification',
                'message': message,
                'notification_type': notification_type,
                'created_at': created_at,
            }
        )


        print(f" [x] Send notification request to channels, for user {user_id}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f" [x] Error: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def chat_callback(ch, method, properties, body):
    body = json.loads(body)
    routing_key = method.routing_key
    routing_key_arr = routing_key.split('.')
    event_type = '.'.join(routing_key_arr[1:])
    print('inside chat_callback:', body, routing_key)
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
            
        if event_type == 'create_chat_room':
            student_id = body['student_id']
            tutor_id = body['tutor_id']
            expiry_date = body['expiry_date']
            print('create chat room:', student_id, tutor_id, expiry_date)
            room, _ = create_or_update_chat_room(student_id, tutor_id, expiry_date)
            if room is None:
                raise Exception("Failed to create or update user")

        print(f" [x] chat event received: {event_type}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

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

    print(' [*] Waiting for notification events...')
    channel.start_consuming()
