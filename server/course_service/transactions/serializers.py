from rest_framework import serializers
from . models import Transaction
from datetime import timedelta

class TransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    course_name = serializers.CharField(source='purchase.course.title', read_only=True)
    mature_date = serializers.SerializerMethodField()
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'transaction_type', 'type_display', 'amount', 
            'status', 'status_display', 'description', 'created_at', 'mature_date',
            'updated_at', 'purchase', 'course_name', 'transaction_id', 'metadata'
        ]
        read_only_fields = fields

    def get_mature_date(self, obj):
        purchase = obj.purchase
        if purchase and purchase.purchased_at and purchase.safe_period:
            return purchase.purchased_at + timedelta(days=purchase.safe_period)
        return None
