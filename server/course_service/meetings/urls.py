from django.urls import path
from .views import ScheduleCommunityMeetingView, AdminCommunityMeetingView, GetCommunityMeetingTokenView

urlpatterns = [
    path('community-meetings/', ScheduleCommunityMeetingView.as_view(), name='community-meeting'),
    path('admin/community-meeting/<int:badge_id>/', AdminCommunityMeetingView.as_view(), name='admin-community-meeting'),
    path('community-meeting/get-token/', GetCommunityMeetingTokenView.as_view(), name='meeting-token'),
]
