from django.urls import path
from . views import RegisterView, VerifyOTPView, LoginView, UserView, UsersView, UserActionView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('register/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('token/', LoginView.as_view(), name='get_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    path('', UsersView.as_view(), name='users'),
    path('user/', UserView.as_view(), name='user'),
    path('user-action/<int:pk>/', UserActionView.as_view(), name='user-block'),
]