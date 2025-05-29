from django.urls import path
from .views import UserRoomsView, RoomMessagesView, UnreadMeassageCountView, FetchRoomIdView, AdminFetchRoomIdView

urlpatterns = [
    path('rooms/', UserRoomsView.as_view(), name='user-rooms'),
    path('rooms/<str:room_id>/messages/', RoomMessagesView.as_view(), name='room-messages'),
    path('rooms/unread-messages/', UnreadMeassageCountView.as_view(), name='room-unread-messages'),
    path('one-one-room/<str:participant_id>/', FetchRoomIdView.as_view(), name='find-one-one-chat'),
    path('admin/one-one-room/<str:participant_id>/', AdminFetchRoomIdView.as_view(), name='find-one-one-chat'),
]