from django.urls import path
from .views import UserRoomsView, RoomMessagesView, UnreadMeassageCountView

urlpatterns = [
    path('rooms/', UserRoomsView.as_view(), name='user-rooms'),
    path('rooms/<str:room_id>/messages/', RoomMessagesView.as_view(), name='room-messages'),
    path('rooms/unread-messages/', UnreadMeassageCountView.as_view(), name='room-unread-messages')
]