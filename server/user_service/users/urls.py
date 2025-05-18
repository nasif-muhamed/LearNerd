from django.urls import path
from . views import RegisterView, VerifyOTPView, ResendOTPView, LoginView,\
    UserView, UsersView, UserDetailsView, UserActionView, MyBadgesView, SubmitQuizView, ForgotPasswordView,\
    ForgotPasswordOTPVerifyView, ForgotPasswordResetView, GoogleLoginView, MultipleTutorDetailsView,\
    SingleTutorDetailsView, NotificationListView, WalletBalanceView, AdminUserView
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
    path('tutor-details/', MultipleTutorDetailsView.as_view(), name='multiple-tutors-details'), # for getting multiple users using an array e.g. tutors
    path('tutor-details/<int:pk>/', SingleTutorDetailsView.as_view(), name='single-tutor-details'), # for getting sigle tutor including course details
    path('user-detail/<int:pk>/', UserDetailsView.as_view(), name='user-details'), # for getting user details e.g. tutor
    path('user-action/<int:pk>/', UserActionView.as_view(), name='user-block'),

    # path('check_admin/', CheckIsAdmin.as_view(), name='is_admin'),
    path('badges/', MyBadgesView.as_view(), name='badge-list'),
    path('quiz/submit/', SubmitQuizView.as_view(), name='submit_quiz'),

    # for fetching unread/read Notificaiton and update a single/all notifications as read
    path('notifications/', NotificationListView.as_view(), name='notification-list'),

    # fetch user's wallet balance
    path('user-wallet/<int:id>/', WalletBalanceView.as_view(), name='wallet-balance'),

    # fetch all reports list.
    # path('admin/all-reports/', AdminListAllReportsView.as_view(), name='list-reports-admin'),
    path('admin-details/', AdminUserView.as_view(), name='admin-details'),

]