import logging
import io
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Sum, F
from django.db.models.functions import Abs
from django.http import HttpResponse

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import  Transaction
from .serializers import TransactionSerializer

from courses.permissions import IsAdminUserCustom, IsUser, IsProfileCompleted
from courses.services import CallUserService, UserServiceException
from courses.views import CustomPagination

logger = logging.getLogger(__name__)
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
        queryset = Transaction.objects.filter(user=user)
        pending_total = queryset.filter(status__in=['pending', 'reported']).aggregate(Sum('amount'))['amount__sum']
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

class AdminTransactionsViewSet(APIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUserCustom]
    pagination_class = CustomPagination

    def get(self, request):
        filter_type = request.query_params.get('filter', 'all').lower()
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        time_filters = {
            'today': {'created_at__gte': today},
            'week': {'created_at__gte': week_start},
            'month': {'created_at__gte': month_start},
            'all': {}
        }
        filter_params = time_filters.get(filter_type, time_filters['all'])

        try:
            queryset = Transaction.objects.filter(**filter_params)
            total_revenue = queryset.filter(transaction_type='course_sale').aggregate(
                total=Sum(Abs(F('amount')))
            )['total'] or 0
            pending_total = queryset.filter(status__in=['pending', 'reported'], transaction_type='course_sale').aggregate(total=Sum('amount'))['total'] or 0
            total_commission = queryset.filter(transaction_type='commission').aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            total_payouts = queryset.filter(status='credited').aggregate(total=Sum('amount'))['total'] or 0
            original_payouts = total_payouts - total_commission
            total_refunds = queryset.filter(status='refunded', transaction_type='course_sale').aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            # # Filter by transaction type
            # transaction_type = request.query_params.get('type')
            # if transaction_type:
            #     queryset = queryset.filter(transaction_type=transaction_type)
            
            # # Filter by status
            # status = request.query_params.get('status')
            # if status:
            #     queryset = queryset.filter(status=status)
            
            # # Filter by direction (income/expense)
            # direction = request.query_params.get('direction')
            # if direction == 'income':
            #     queryset = queryset.filter(amount__gt=0)
            # elif direction == 'expense':
            #     queryset = queryset.filter(amount__lt=0)
            
            # # Filter by date range
            # start_date = request.query_params.get('start_date')
            # if start_date:
            #     queryset = queryset.filter(created_at__gte=start_date)
                
            # end_date = request.query_params.get('end_date')
            # if end_date:
            #     queryset = queryset.filter(created_at__lte=end_date)
            
            # # Search by description or course name
            # search = request.query_params.get('search')
            # if search:
            #     queryset = queryset.filter(
            #         Q(description__icontains=search) | 
            #         Q(purchase_course__title__icontains=search)
            #     )

            paginator = self.pagination_class()
            paginated_queryset = paginator.paginate_queryset(queryset, request)

            serializer = self.serializer_class(paginated_queryset, many=True)
            paginated_response = paginator.get_paginated_response(serializer.data)

            paginated_response.data['total_revenue'] = total_revenue
            paginated_response.data['total_commission'] = total_commission
            paginated_response.data['total_payouts'] = original_payouts if original_payouts > 0 else 0
            paginated_response.data['total_refunds'] = total_refunds
            paginated_response.data['pending_total'] = pending_total

            return paginated_response
    
        except Exception as e:
            logger.exception(f"Error in AdminDashboardView: {e}")
            return Response({'error': 'An error occurred while fetching dashboard data.'}, status=500)

class AdminTransactionsPDFView(APIView):
    permission_classes = [AllowAny] # it should change to IsAdminUserCustom in future. not secure.

    def get(self, request):
        try:
            # Reuse the same filtering logic
            filter_type = request.query_params.get('filter', 'all').lower()
            now = timezone.now()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today - timedelta(days=today.weekday())
            month_start = today.replace(day=1)
            
            time_filters = {
                'today': {'created_at__gte': today},
                'week': {'created_at__gte': week_start},
                'month': {'created_at__gte': month_start},
                'all': {}
            }
            filter_params = time_filters.get(filter_type, time_filters['all'])

            queryset = Transaction.objects.filter(**filter_params)
            total_revenue = queryset.filter(transaction_type='course_sale').aggregate(
                total=Sum(Abs(F('amount')))
            )['total'] or 0
            pending_total = queryset.filter(status__in=['pending', 'reported'], transaction_type='course_sale').aggregate(total=Sum('amount'))['total'] or 0
            total_commission = queryset.filter(transaction_type='commission').aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            total_payouts = queryset.filter(status='credited').aggregate(total=Sum('amount'))['total'] or 0
            original_payouts = total_payouts - total_commission
            total_refunds = queryset.filter(status='refunded', transaction_type='course_sale').aggregate(total=Sum(Abs(F('amount'))))['total'] or 0

            # Generate PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()

            # Title
            elements.append(Paragraph("Transaction Report", styles['Title']))
            elements.append(Spacer(1, 12))

            # Summary
            summary_data = [
                ['Total Revenue:', f"{total_revenue:.2f}"],
                ['Pending Total:', f"{pending_total:.2f}"],
                ['Total Commission:', f"{total_commission:.2f}"],
                ['Total Payouts:', f"{original_payouts:.2f}"],
                ['Total Refunds:', f"{total_refunds:.2f}"],
            ]
            summary_table = Table(summary_data)
            summary_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 24))

            # Transaction Table
            data = [['ID', 'Type', 'Amount', 'Status', 'Description', 'Date']]
            for transaction in queryset:
                data.append([
                    transaction.id,
                    transaction.get_transaction_type_display(),
                    f"{transaction.amount:.2f}",
                    transaction.get_status_display(),
                    transaction.description or '-',
                    transaction.created_at.strftime('%Y-%m-%d %H:%M')
                ])

            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)

            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="transaction_report.pdf"'
            response.write(buffer.getvalue())
            buffer.close()
            return response

        except Exception as e:
            logger.exception(f"Error in PDF generation: {e}")
            return Response({'error': 'An error occurred while generating the PDF.'}, status=500)
