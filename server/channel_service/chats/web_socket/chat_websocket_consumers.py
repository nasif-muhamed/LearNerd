import json
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django_redis import get_redis_connection
from asgiref.sync import sync_to_async
from ..models import User, Message, Room
from ..serializers import MessageSerializer, UserSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user_payload = self.scope.get('user_payload')
        if not user_payload or not user_payload.get('user_id'):
            await self.close()
            return

        self.user_id = user_payload['user_id']
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        if not await self.is_user_in_room():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Add to Redis online users set. For tracking users online in a room.
        redis = get_redis_connection("default")
        await sync_to_async(redis.sadd)(f'online_users:{self.room_id}', self.user_id)

        # notice others the user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online_status',
                'user_id': self.user_id,
                'is_online': True,
            }
        )

        # send online users list to the self.user
        online_user_count = await self.get_online_users()
        await self.send(text_data=json.dumps({
            'type': 'room_online_status',
            'online_user_count': len(online_user_count)
        }))

        # change read status if un read message exist.
        readed_msg_count = await self.mark_messages_read()
        print('readed_msg_count:', readed_msg_count)
        if readed_msg_count > 0:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'user_id': self.user_id,
                    'room_id': self.room_id
                }
            )

    async def disconnect(self, close_code):
        # Remove from Redis online users set. For changing the status to offline.
        print('insied disconnect')
        redis = get_redis_connection("default")
        await sync_to_async(redis.srem)(f'online_users:{self.room_id}', self.user_id)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online_status',
                'user_id': self.user_id,
                'is_online': False,
            }
        )

        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        print('data:', data, self.user_id)


        if message_type == 'message':
            message = data['message']
            # Save message to database and get serialized data to send back
            serialized_message  = await self.save_message(message)
            print('serialized_message:', serialized_message)
            if serialized_message:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'sender_id': self.user_id,
                        'message': serialized_message,
                    }
                )

                # Send notification to other users in the room
                await self.send_message_notification_to_others(serialized_message, self.user_id)
            else:
                await self.channel_layer.group_send(
                    f'user_{self.user_id}',
                    {
                        'type': 'send_notification',
                        'notification_type': 'chat_expired',
                        'message': f'chat expired',
                        'created_at': str(datetime.utcnow()),
                    }
                )

        
        elif message_type == 'typing':
            print('inside typing')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'sender_id': self.user_id,
                    'is_typing': data['is_typing']
                }
            )
        
        elif message_type == 'read_receipt':
            print('inside read reciept')
            await self.mark_message_read(data['message'])
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'user_id': self.user_id,
                    'room_id': self.room_id
                }
            )

    async def chat_message(self, event):
        # Send message to all clients inside a socket, including the sender.
        new_message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': new_message
        }))
        print('new_message:', new_message)

        # # to send notification to those who are in the group - it's only sending to those who are on online.
        # if event['sender_id'] != self.user_id:
        #     await self.channel_layer.group_send(
        #         f'user_{self.user_id}',
        #         {
        #             'type': 'send_notification',
        #             'notification_type': 'new_message',
        #             'message': new_message,
        #             'created_at': str(datetime.utcnow()),
        #         }
        #     )

    async def typing_indicator(self, event):
        print('inside typing indicator', event['sender_id'], self.user_id)
        # if event['sender_id'] != self.user_id:  # for not sending to the typing user
        if event['sender_id'] == self.user_id:
            return

        user_details = await self.get_user(event['sender_id'])

        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user': user_details,
            'is_typing': event['is_typing']
        }))

    async def read_receipt(self, event):
        if event['user_id'] == self.user_id:
            return

        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event['user_id'],
            'room_id': event['room_id']
        }))

    async def user_online_status(self, event):
        if event['user_id'] == self.user_id:
            return  # Don't send to the user himself

        await self.send(text_data=json.dumps({
            'type': 'online_status',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        }))

    async def get_online_users(self):
        redis = get_redis_connection("default")
        user_ids = await sync_to_async(redis.smembers)(f'online_users:{self.room_id}')
        # Decode bytes to str and filter any invalid values
        return [int(uid.decode()) for uid in user_ids if uid]

    async def send_message_notification_to_others(self, message_data, current_user_id):
        other_user_ids = await self.get_other_users_in_room()
        online_users = await self.get_online_users()

        for user in other_user_ids:
            print(user)
            uid = user.id
            if uid not in online_users and uid != current_user_id:
                await self.channel_layer.group_send(
                    f'user_{uid}',
                    {
                        'type': 'send_notification',
                        'notification_type': 'new_message',
                        'message': message_data,
                        'created_at': str(datetime.utcnow()),
                    }
                )

    @database_sync_to_async
    def is_user_in_room(self):
        try:
            user = User.objects.get(user_id=self.user_id)
            return Room.objects(id=self.room_id, participants=user).first() is not None
        except User.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message):
        user = User.objects.get(user_id=self.user_id)
        room = Room.objects.get(id=self.room_id)
        print('now > expiry:', room.room_type, room.room_type == 'one-to-one' and datetime.utcnow() > room.expires_at, datetime.utcnow(), room.expires_at)
        if room.room_type == 'one-to-one' and datetime.utcnow() > room.expires_at:
            return
        msg = Message(
            room=room,
            sender=user,
            content=message,
            message_type='text',
        )
        msg.save()

        room.last_message = msg
        room.updated_at = datetime.utcnow()
        room.save()

        return MessageSerializer(msg).data
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            user = User.objects.get(user_id=user_id)
            serializer = UserSerializer(user)
            print('serializer get_user:', serializer.data)
            return {
                'user_id': serializer.data['user_id'],
                'full_name': serializer.data['full_name'],
                'image': serializer.data['image'],
            }
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_messages_read(self):
        user = User.objects.get(user_id=self.user_id)
        room = Room.objects.get(id=self.room_id)
        if room.room_type != 'one-to-one': return 0
        messages_to_update = Message.objects(
            room=room,
            is_read='no',
            sender__ne=user
        )
        count = messages_to_update.count()
        messages_to_update.update(set__is_read='yes')
        return count

    @database_sync_to_async
    def mark_message_read(self, id):
        user = User.objects.get(user_id=self.user_id)
        room = Room.objects.get(id=self.room_id)
        if room.room_type != 'one-to-one': return 0
        messages_to_update = Message.objects(
            id=id,
            room=room,
            sender__ne=user
        )
        messages_to_update.update(set__is_read='yes')

    @database_sync_to_async
    def get_other_users_in_room(self):
        room = Room.objects.get(id=self.room_id)
        other_users = room.participants
        print('other_users:', other_users)
        return other_users

    # @database_sync_to_async
    # def get_user_name(self, user_id):
    #     user = User.objects.get(id=user_id)
    #     return user.full_name  # Adjust based on your User model

