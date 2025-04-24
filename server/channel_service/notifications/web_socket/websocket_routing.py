# api_gateway/websocket_routing.py
from django.urls import re_path
from . import websocket_consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', websocket_consumers.NotificationConsumer.as_asgi()),
]

print("WebSocket URL patterns loaded:-: ++++++++++++++++++++++++", websocket_urlpatterns)
