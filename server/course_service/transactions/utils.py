from decimal import Decimal
from django.db import transaction as db_transaction
from .models import Transaction
from django.conf import settings
from .message_broker.rabbitmq_publisher import publish_transaction_event

@db_transaction.atomic
def record_course_purchase(purchase, purchase_type, transaction_id=None):
    # 1. Debit buyer's wallet (immediate)
    print('inside record_course_purchase')
    purchase_transaction = Transaction.objects.create(
        user=purchase.user,
        transaction_type='course_purchase',
        amount=-purchase.subscription_amount,  # Negative amount as money is debiting
        status='completed',
        description=f"Purchase of {purchase.course.title}",
        purchase=purchase,
        transaction_id=transaction_id
    )
    
    # 2. Credit seller's wallet (pending)    
    sale_transaction = Transaction.objects.create(
        user=purchase.course.instructor,
        transaction_type='course_sale',
        amount=purchase.subscription_amount, 
        status='pending',  # Pending until safety period ends
        description=f"Sale of {purchase.course.title}",
        purchase=purchase,
        transaction_id=transaction_id,
    )
    
    print('purchase_transaction:', purchase_transaction, sale_transaction)
    return purchase_transaction, sale_transaction,

@db_transaction.atomic
def record_platform_fee_collect(transaction):
    # Calculate platform commission (e.g., 10%)
    commission_rate = Decimal('0.10')
    commission_amount = transaction.amount * commission_rate
    tutor_credit_amount = transaction.amount - commission_amount
    user = transaction.user
    print('inside record_platform_fee_collect')
    print('Admin user:', user)
    # 1. Record platform commission.
    commision_transaction = Transaction.objects.create(
        user=user,
        transaction_type='commission',
        amount=-commission_amount,  # Negative amount as money is debiting
        status='debited',
        description=f"Commition Deduction for purchase ref: {transaction.purchase.id}",
        purchase=transaction.purchase,
    )
    print('commision_transaction:', commision_transaction)

    # 2. Update tutor's transaction to credited. 
    transaction.status = 'credited'
    transaction.metadata = {
        'commision': str(commission_amount),
        'credited': str(tutor_credit_amount)
    }
    transaction.save()
    print('updated_transaction:', transaction)

    # 3. Update User's wallet
    publish_transaction_event(
        event_type='wallet_credit',
        data={
            'user_id': transaction.user,
            'amount' : str(tutor_credit_amount)
        }
    )
    print('after rbmq event:')
    return commision_transaction

@db_transaction.atomic
def record_transaction_reported(purchase):
    seller_transaction = Transaction.objects.get(
        user=purchase.course.instructor,
        transaction_type='course_sale',
        purchase=purchase,
        status='pending',
    ) 
    print('seller_transaction:', seller_transaction)
    seller_transaction.status = 'reported'
    seller_transaction.save()

@db_transaction.atomic
def change_transaction_status_back_to_pending(purchase):
    print('inside change_transaction_status_back_to_pending')
    # 1. Change the transaction status back to 'pending'
    transaction = Transaction.objects.get(
        user=purchase.course.instructor,
        transaction_type='course_sale',
        purchase=purchase,
    )
    print('transaction:', transaction)
    if transaction.status == 'reported':
        transaction.status = 'pending'
        transaction.save()

@db_transaction.atomic
def record_course_refund(purchase):
    print('inside record_course_refund')
    print(purchase.id, purchase, purchase.user, purchase.course.instructor)

    # 1. Refund buyer's wallet (immediate)
    buyer_transaction = Transaction.objects.get(
        user=purchase.user,
        transaction_type='course_purchase',
        purchase=purchase,
        status='completed',
    )
    print('buyer_transaction:', buyer_transaction)
    buyer_transaction.status = 'refunded'
    buyer_transaction.amount *= -1 
    buyer_transaction.save()
    
    print('updated_transaction:', buyer_transaction)

    # Update buyer's wallet
    publish_transaction_event(
        event_type='wallet_credit',
        data={
            'user_id': buyer_transaction.user,
            'amount' : str(buyer_transaction.amount)
        }
    )
    print('after rbmq event:')

    # 2. Debit seller's wallet (immediate)
    seller_transaction = Transaction.objects.get(
        user=purchase.course.instructor,
        transaction_type='course_sale',
        purchase=purchase,
        status='reported',
    ) 
    print('seller_transaction:', seller_transaction)
    seller_transaction.status = 'refunded'
    seller_transaction.amount *= -1
    seller_transaction.save()

    return buyer_transaction, seller_transaction
