from django.urls import path
from . views import AdminView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='get_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    # path('', UsersView.as_view(), name='users'),    
    path('<int:pk>/', AdminView.as_view(), name='admin-user'),
]