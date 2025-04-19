import pika
import json
import os

def publish_notification_event(event_type, data):
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
    rabbitmq_pass = os.getenv('RABBITMQ_PASS', 'guest')
    print('rbmq creds---=====+++++++++:', rabbitmq_host, rabbitmq_pass, rabbitmq_user)
    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
    )
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'notification_events'
    channel.exchange_declare(exchange=exchange_name, exchange_type='topic', durable=True)

    # Publish message
    routing_key = f"notification.{event_type}"
    message = json.dumps(data)
    channel.basic_publish(
        exchange=exchange_name,
        routing_key=routing_key,
        body=message,
        properties=pika.BasicProperties(delivery_mode=2)  # Persistent
    )

    print(f" [x] Sent {routing_key}: {message}")
    connection.close()