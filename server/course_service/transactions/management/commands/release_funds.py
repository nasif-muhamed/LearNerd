
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import F, ExpressionWrapper, DateTimeField
from courses.models import Purchase
from transactions.models import Transaction
from ...utils import record_platform_fee_collect

class Command(BaseCommand):
    help = 'Check for purchases with expired safe periods and update transactions and wallets'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        # Find purchases where safe period has expired and not refunded
        safe_period_end = ExpressionWrapper(
            F('purchase__purchased_at') + (F('purchase__safe_period') * timedelta(days=1)),
            output_field=DateTimeField()
        )   

        pending_transactions = Transaction.objects.filter(
            status='pending',
            purchase__isnull=False,
            purchase__safe_period__isnull=False,
        ).annotate(
            safe_period_end=safe_period_end
        ).filter(
            safe_period_end__lt=timezone.now()
        )
        print('expired:', pending_transactions)
        for transaction in pending_transactions:
            print('pending_transaction:', transaction)
            print('expiration:', transaction.purchase.safe_period, transaction.purchase.purchased_at)
            record_platform_fee_collect(transaction)
            self.stdout.write(self.style.SUCCESS(
                f'Processed purchase {transaction.purchase.id}: Credited {transaction.amount} to {transaction.user}'
            ))
