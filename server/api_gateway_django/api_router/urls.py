from django.urls import path, re_path
from . import views

urlpatterns = [
    path('', views.hello_world, name='hello'),
    re_path(r'^api/users/.*$', views.proxy_to_user_service, name='proxy-user'),
    re_path(r'^api/admin/.*$', views.proxy_to_admin_service, name='proxy-admin'),
    re_path(r'^api/badge/.*$', views.proxy_to_admin_service, name='proxy-badges'),
]
