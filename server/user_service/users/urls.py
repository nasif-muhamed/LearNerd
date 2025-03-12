from django.urls import path
from . views import RegisterView, VerifyOTPView, ResendOTPView, LoginView,\
    UserView, UsersView, UserActionView, MyBadgesView, SubmitQuizView, ForgotPasswordView,\
    ForgotPasswordOTPVerifyView, ForgotPasswordResetView, GoogleLoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('register/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'), # used for both register and forgot password
    path('token/', LoginView.as_view(), name='get_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),  # New endpoint
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('forgot-password/verify-otp/', ForgotPasswordOTPVerifyView.as_view(), name='forgot_password_verify_otp'),
    path('forgot-password/reset/', ForgotPasswordResetView.as_view(), name='forgot_password_reset'),
    path('', UsersView.as_view(), name='users'),
    path('user/', UserView.as_view(), name='user'),
    path('user-action/<int:pk>/', UserActionView.as_view(), name='user-block'),
    path('badges/', MyBadgesView.as_view(), name='badge-list'),
    path('quiz/submit/', SubmitQuizView.as_view(), name='submit_quiz'),
]