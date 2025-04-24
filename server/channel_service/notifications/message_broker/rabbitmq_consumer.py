import pika
import json
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model

Profile = get_user_model()
def callback(ch, method, properties, body):
    body = json.loads(body)
    routing_key = method.routing_key
    print('inside callback:', body, routing_key)
    try:
        user_id = body['user_id']
        message = body['message']
        notification_type = body['notification_type']
        created_at = body['created_at']

        channel_layer = get_channel_layer()
        print('before sending websockent @@@@@@@@@@@@@@@@')
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
    queue_name = 'channel_service_notification_send'
    channel.queue_declare(queue=queue_name, durable=True)

    # Bind queue to exchange
    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name,
        routing_key='notification.send'
    )

    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print(' [*] Waiting for notification events...')
    channel.start_consuming()
