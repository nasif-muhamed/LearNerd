from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, AdminTransactionsViewSet, AdminTransactionsPDFView

urlpatterns = [
    # single user's transaction history with filetering options
    path('', TransactionViewSet.as_view(), name='user-transactions'), 
    path('admin/', AdminTransactionsViewSet.as_view(), name='admin-transactions'), 
    path('admin/pdf/', AdminTransactionsPDFView.as_view(), name='admin-transactions-pdf'),
]
