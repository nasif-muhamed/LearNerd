import pika
import json
import os
from decimal import Decimal
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from ..models import Notification, AdminUser, Wallet

Profile = get_user_model()

def notification_callback(ch, method, properties, body):
    message = json.loads(body)
    routing_key = method.routing_key
    routing_key_arr = routing_key.split('.')
    event_type = '.'.join(routing_key_arr[2:])  # e.g., 'purchase' from 'notification.course.purchase' and 'report.refund' incase of 'notification.course.report.refund'
    print('inside callback user_service:', message, routing_key)
    try:
        student_id = message['student_id']
        student = Profile.objects.get(id=student_id)
        tutor_id = message['tutor_id']
        tutor = Profile.objects.get(id=tutor_id)

        config = None
        if event_type == 'purchase':
            config = {
                'type': Notification.NotificationType.COURSE_PURCHASE,
                'message': f'{student.full_name_or_email} purchased your course "{message.get("course_title")}" with {message.get("purchase_type")} option'
            }

        elif event_type == 'upgraded':
            config = {
                'type': Notification.NotificationType.COURSE_UPGRADE,
                'message': f'{student.full_name_or_email} upgraded the course "{message.get("course_title")}" to {message.get("purchase_type")}'
            }

        elif event_type == 'review':
            config = {
                'type': Notification.NotificationType.COURSE_REVIEW,
                'message': f"{student.full_name_or_email} rated your course {message.get('course_title')} {message.get('rating')} out of 5"
            }

        elif event_type == 'report':
            config = {
                'type': Notification.NotificationType.USER_REPORT,
                'message': f"{student.full_name_or_email} reported course {message.get('course_title')} by {student.full_name_or_email}"
            }

        elif event_type == 'report.refund':
            config = {
                'student': {
                    'type': Notification.NotificationType.COURSE_REFUND_CREDIT,
                    'message': f"Refund request for course '{message.get('course_title')}' by {tutor.full_name_or_email} has been approved. Amount {message.get('amount')} credited to your wallet."
                },
                'instructor': {
                    'type': Notification.NotificationType.COURSE_REFUND_DEBIT,
                    'message': f"Refund request by {student.full_name_or_email} for course '{message.get('course_title')}' has been approved. Amount {message.get('amount')} won't be credited to your wallet."
                }
            }

        elif event_type == 'report.resolved' or event_type == 'report.rejected':
            config = {
                'type': Notification.NotificationType.REPORT_REJECTED if event_type == 'report.rejected' else Notification.NotificationType.REPORT_RESOLVED,
                'message': f"Your report for course '{message.get('course_title')}' has been {event_type.split('.')[-1]} by admin."
            }

        elif event_type == 'video_sesssion.request' or event_type == 'video_sesssion.approved':
            config = {
                'type': Notification.NotificationType.VID_SESSION_REQUESTED if event_type == 'video_sesssion.request' else Notification.NotificationType.VID_SESSION_APPROVED,
                'message': f"{student.full_name_or_email + ' requested a video session for' if event_type == 'video_sesssion.request' else tutor.full_name_or_email + ' have approved a video session'} for the course: '{message.get('course_title')}'."
            }


        if config is None:
            print(f" [x] Unknown event type: {event_type}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Create notification
        if event_type == 'purchase' or event_type == 'review' or event_type == 'upgraded' or event_type == 'video_sesssion.request':
            Notification.objects.create(
                user=tutor,
                notification_type=config['type'],
                message=config['message'],
            )

        elif event_type == 'report.resolved' or event_type == 'report.rejected' or event_type == 'video_sesssion.approved':
            Notification.objects.create(
                user=student,
                notification_type=config['type'],
                message=config['message'],
            )

        elif event_type == 'report':
            admin_users = AdminUser.objects.all()
            for user in admin_users:
                Notification.objects.create(
                    user=user.profile,
                    notification_type=config['type'],
                    message=config['message'],
                )

        elif event_type == 'report.refund':
            Notification.objects.create(
                user=student,
                notification_type=config['student']['type'],
                message=config['student']['message'],
            )
            Notification.objects.create(
                user=tutor,
                notification_type=config['instructor']['type'],
                message=config['instructor']['message'],
            )

        print(f" [x] Created notification for user {tutor}: {config['message']}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except User.DoesNotExist:
        print(f" [x] User {student_id} not found")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        print(f" [x] Error: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def transaction_callback(ch, method, properties, body):
    message = json.loads(body)
    routing_key = method.routing_key
    event_type = routing_key.split('.')[-1]  # e.g., 'purchase' from 'notification.course.purchase'
    print('inside callback transaction:', message, routing_key)
    try:
        user_id = message['user_id']
        amount = message['amount']
        user = Profile.objects.get(id=user_id)
        wallet, _ = Wallet.objects.get_or_create(user=user)

        if event_type == 'wallet_credit':
            wallet.credit_balance(Decimal(amount))
            Notification.objects.create(
                user=user,
                notification_type=Notification.NotificationType.WALLET_CREDIT,
                message=f"{amount} credited to your wallet",
            )

        elif event_type == 'wallet_debit':
            wallet.debit_balance(Decimal(amount))

        else:
            print(f" [x] Unknown event type: {event_type}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        print(f" [x] Updated walle for user {user}: {amount, event_type}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except User.DoesNotExist:
        print(f" [x] User {user_id} not found")
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
       
    notification_exchange = 'notification_events'
    notification_queue = 'user_service_notifications'
    channel.exchange_declare(exchange=notification_exchange, exchange_type='topic', durable=True)  # Declare exchange 
    channel.queue_declare(queue=notification_queue, durable=True)  # Declare a queue
    channel.queue_bind(exchange=notification_exchange, queue=notification_queue, routing_key='notification.course.#')  # Bind queue to exchange

    transaction_exchange = 'transaction_events'
    transaction_queue = 'user_service_transactions'
    channel.exchange_declare(exchange=transaction_exchange, exchange_type='topic', durable=True)
    channel.queue_declare(queue=transaction_queue, durable=True)
    channel.queue_bind(exchange=transaction_exchange, queue=transaction_queue, routing_key='transaction.*')


    # Set up consumer
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=notification_queue, on_message_callback=notification_callback)
    channel.basic_consume(queue=transaction_queue, on_message_callback=transaction_callback)

    print(' [*] Waiting for notification events...')
    channel.start_consuming()
