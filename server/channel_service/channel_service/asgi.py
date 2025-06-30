"""
ASGI config for channel_service project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'channel_service.settings')
django.setup()  # Explicitly initialize Django settings
from .middlewares.ws_jwt_auth import JWTAuthMiddleware  # Custom JWT authentication middleware
from .web_socket.websocket_routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'channel_service.settings')

# application = get_asgi_application()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})