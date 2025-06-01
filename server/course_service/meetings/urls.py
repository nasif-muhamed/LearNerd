from django.urls import path
from .views import ScheduleCommunityMeetingView

urlpatterns = [
    path('community-meetings/', ScheduleCommunityMeetingView.as_view(), name='community-meeting'),

]
