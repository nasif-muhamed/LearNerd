from django.urls import path
from .views import AdminDashboardView, ChartDataView, TutorDashboardView, TutorChartDataView

urlpatterns = [
    # Dashboard view for Admin
    path('admin-dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin-dashboard-chart/', ChartDataView.as_view(), name='admin_dashboard_chart'),

    # Dashboard view for Tutor
    path('tutor-dashboard/', TutorDashboardView.as_view(), name='tutor_dashboard'),
    path('tutor-dashboard-chart/', TutorChartDataView.as_view(), name='tutor_dashboard_chart'),
]
