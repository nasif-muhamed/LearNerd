from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet

urlpatterns = [
    # single user's transaction history with filetering options
    path('', TransactionViewSet.as_view(), name='user-transactions'),
]
