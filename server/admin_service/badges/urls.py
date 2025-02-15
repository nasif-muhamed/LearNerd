from django.urls import path
from .views import BadgeView

urlpatterns = [
    path('', BadgeView.as_view(), name='badge-list-create'),
    path('<int:id>/', BadgeView.as_view(), name='badge-detail'),
]
