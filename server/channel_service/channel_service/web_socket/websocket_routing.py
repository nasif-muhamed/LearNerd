# channel_service/websocket_routing.py
from django.urls import re_path
# from notifications.web_socket import websocket_consumers
from chats.web_socket import chat_websocket_consumers, notification_websocket_consumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', notification_websocket_consumer.NotificationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_id>[a-f0-9]{24})/$', chat_websocket_consumers.ChatConsumer.as_asgi()),
]

