from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Sum

from .models import  Transaction
from .serializers import TransactionSerializer

from courses.permissions import IsAdminUserCustom, IsUser, IsProfileCompleted
from courses.services import CallUserService, UserServiceException

call_user_service = CallUserService()

class TransactionViewSet(APIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsProfileCompleted]

    def get(self, request):
        user = self.request.user_payload['user_id']
        try:
            response_user_service = call_user_service.get_user_wallet(user)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)
        wallet_data = response_user_service.json()
        print('wallet_response:', wallet_data)
        queryset = Transaction.objects.filter(user=user)
        pending_total = queryset.filter(status='pending').aggregate(Sum('amount'))['amount__sum']
        print('queryset:', queryset)
        # Filter by transaction type
        transaction_type = request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by status
        status = request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by direction (income/expense)
        direction = request.query_params.get('direction')
        if direction == 'income':
            queryset = queryset.filter(amount__gt=0)
        elif direction == 'expense':
            queryset = queryset.filter(amount__lt=0)
        
        # Filter by date range
        start_date = request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
            
        end_date = request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Search by description or course name
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) | 
                Q(purchase_course__title__icontains=search)
            )
        
        serializer = self.serializer_class(queryset, many=True)
        return Response({'balance': Decimal(wallet_data['balance']), 'pendingBalance': pending_total or 0, 'transactions':serializer.data})

