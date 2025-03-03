from django.urls import path
from . views import LoginView, VerifyOTPView, AdminView, AdminUserActionView, UserListView, AdminAuthView
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
]