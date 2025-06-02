from django.urls import path
from .views import ScheduleCommunityMeetingView, AdminCommunityMeetingView

urlpatterns = [
    path('community-meetings/', ScheduleCommunityMeetingView.as_view(), name='community-meeting'),
    path('admin/community-meeting/<int:badge_id>/', AdminCommunityMeetingView.as_view(), name='admin-community-meeting'),
]
