from django.db import models
from courses.models import Purchase

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('course_sale', 'Course Sale'),
        ('course_purchase', 'Course Purchase'),
        ('admin_payout', 'Admin Payout'),
        ('ad_revenue', 'Ads Revenue'),
        ('commission', 'Platform Commission'),
        ('refund', 'Refund'),
        ('withdrawal', 'Withdrawal'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('debited', 'Debited'),
        ('credited', 'Credited'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('reported', 'Reported'),
    )
    
    user = models.BigIntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, null=True)
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='transactions', blank=True, null=True)
    transaction_id = models.CharField(max_length=50, blank=True, null=True)    
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - ${self.amount} - {self.status}"
