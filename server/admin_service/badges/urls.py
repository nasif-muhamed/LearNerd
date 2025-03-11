from django.urls import path
from .views import BadgesView, BadgeView, EvaluateQuizView

urlpatterns = [
    path('', BadgesView.as_view(), name='badge-list-create'),
    path('<int:id>/', BadgeView.as_view(), name='badge-detail'),
    path('evaluate/', EvaluateQuizView.as_view(), name='evaluate_quiz'),
]
