from django.urls import path
from . views import LoginView, VerifyOTPView, AdminView, AdminUserActionView, UserListView, AdminNotificationView,\
      AdminListReportsAPIView, AdminAuthView, AdminReportActionAPIView, AdminDashboardView, AdminDashboardChartView,\
      AdminTransactionsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('login/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    # path('token/', TokenObtainPairView.as_view(), name='get_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    # path('', UsersView.as_view(), name='users'),    
    path('<int:pk>/', AdminView.as_view(), name='admin-user'),
    path('user-action/<int:pk>/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('users/', UserListView.as_view(), name='list-user'),
    path('permission/', AdminAuthView.as_view(), name='permission'),

    path('notifications/', AdminNotificationView.as_view(), name='list-admin-notifications'),
    path('all-reports/', AdminListReportsAPIView.as_view(), name='admin-list-reports'), # to list all reports for the admin
    path('report/<int:pk>/', AdminReportActionAPIView.as_view(), name='admin-report-action'), # to list all reports for the admin
    path('dashboard/', AdminDashboardView.as_view(), name='admin-report-action'), # to get dashboard datas
    path('dashboard-charts/', AdminDashboardChartView.as_view(), name='admin-report-action'), # to get dashboard chart datas

    path('transactions/', AdminTransactionsView.as_view(), name='admin-report-action'), # to get all users transactions
]