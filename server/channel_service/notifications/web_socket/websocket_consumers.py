import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print('inside connect -----------------')
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user_group_name = f'user_{self.user_id}'

        # Join user-specific group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave user-specific group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle incoming messages (if needed)
        pass

    async def send_notification(self, event):
        # Send notification to WebSocket client
        await self.send(text_data=json.dumps({
            'type': event['notification_type'],
            'message': event['message'],
            'created_at': event['created_at'],
        }))