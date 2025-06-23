import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user_payload = self.scope.get('user_payload')
        if not user_payload or not user_payload.get('user_id'):
            # Close connection if not authenticated
            await self.close()
            return
        
        self.user_id = user_payload['user_id']
        self.user_group_name = f'user_{self.user_id}'

        # Join user-specific group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    # Leave user-specific group
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    # Send notification to WebSocket client
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'notification_type': event['notification_type'],
            'message': event['message'],
            'created_at': event['created_at'],
        }))
