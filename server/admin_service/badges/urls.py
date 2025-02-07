from django.urls import path
from .views import BadgesView, BadgeView

urlpatterns = [
    path('', BadgesView.as_view(), name='badge-list-create'),
    path('<int:id>/', BadgeView.as_view(), name='badge-detail'),
]
