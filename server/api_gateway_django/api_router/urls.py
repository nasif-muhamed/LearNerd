from django.urls import path, re_path
from . import views

urlpatterns = [
    path('v1/hello/', views.SimpleAPIView.as_view(), name='simple-api'),
    path('v1/users/user/', views.UserProfileGateway.as_view(), name='user-profile'),
    path('v1/badges/', views.BadgeGateway.as_view(), name="admin-badge"),
    path('v1/badges/<int:id>/', views.SingleBadgeGateway.as_view(), name="admin-badge-single"),
    path('v1/courses/', views.BasicCouseCreationGateway.as_view(), name="course-creation"),
    path('v1/courses/section-items/', views.BasicCouseCreationGateway.as_view(), name="sectionItem-creation"),
    path('v1/courses/stripe/webhook/', views.proxy_to_course_web_hook, name="stripe-webhook"), # webhook request's bodyshould be passed to course service as it is without manipulation or parsing, otherwise the verification will fail.
    
    re_path(r'^v1/users/.*$', views.proxy_to_user_service, name='proxy-user'),
    re_path(r'^v1/admin/.*$', views.proxy_to_admin_service, name='proxy-admin'),
    re_path(r'^v1/badges/.*$', views.proxy_to_badges_service, name='proxy-badges'),
    re_path(r'^v1/courses/.*$', views.proxy_to_course_service, name='proxy-course'),
]
