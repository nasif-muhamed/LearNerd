from rest_framework import serializers
from .models import User, Room, Message, Meeting
from urllib.parse import urlparse
from django_redis import get_redis_connection
from django.utils import timezone

class UserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    email = serializers.CharField()
    full_name = serializers.CharField(allow_null=True)
    image = serializers.SerializerMethodField()
    is_admin = serializers.CharField()

    def get_image(self, obj):
        if not obj.image:
            return None
        parsed = urlparse(obj.image)
        if parsed.path.startswith('/media'):
            return parsed.path
        return obj.image 

class MessageSerializer(serializers.Serializer):
    id = serializers.CharField(source='id.__str__')
    sender = UserSerializer()
    content = serializers.CharField()
    message_type = serializers.CharField()
    is_read = serializers.CharField()
    timestamp = serializers.DateTimeField()
    room = serializers.CharField(source='room.id.__str__')

class MeetingSerializer(serializers.Serializer):
    id = serializers.CharField(source='id.__str__')
    # group = RoomSerializer()
    title = serializers.CharField()
    scheduled_time = serializers.DateTimeField()

class RoomSerializer(serializers.Serializer):
    id = serializers.CharField(source='id.__str__')
    room_type = serializers.CharField()
    participants = serializers.SerializerMethodField()
    name = serializers.CharField(allow_null=True)
    image = serializers.CharField(allow_null=True)
    last_message = MessageSerializer(allow_null=True)
    un_read_messages = serializers.SerializerMethodField()
    online_user_count = serializers.SerializerMethodField()
    temp_chat = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField(allow_null=True)
    meeting = serializers.SerializerMethodField()

    def get_participants(self, obj):
        # Get the requesting user_id from context
        print("Context in RoomSerializer:", self.context)
        user_id = self.context.get('user_id')
        if user_id:
            # Filter out the requesting user from participants
            participants = [p for p in obj.participants if p.user_id != user_id]
            if obj.room_type == 'one-to-one':
                # For one-to-one rooms, return the other participant
                if participants:
                    return UserSerializer(participants[0]).data
            return UserSerializer(participants, many=True).data
        return UserSerializer(obj.participants, many=True).data
    
    def get_un_read_messages(self, obj):
        user_id = self.context.get('user_id')
        user = User.objects.get(user_id = user_id)
        un_read_messages_count = Message.objects(
            room=obj,
            is_read='no',
            sender__ne=user,
        ).count()
        return un_read_messages_count

    def get_online_user_count(self, obj):
        redis = get_redis_connection("default")
        key = f'online_users:{str(obj.id)}'
        user_ids = redis.smembers(key)
        user_ids_list = [int(uid.decode()) for uid in user_ids]
        print('user_ids_list:', user_ids_list)
        return len(user_ids_list)
    
    def get_meeting(self, obj):
        try:
            now = timezone.now()
            meeting = Meeting.objects(group=obj).order_by('-scheduled_time').first()
            print(f"Meeting for room {obj.id}: {meeting.title}")
            if meeting:
                print(f"meeting.scheduled_time: {meeting.scheduled_time}, tzinfo: {meeting.scheduled_time.tzinfo}")
                print(f"now: {now}, tzinfo: {now.tzinfo}")
                
            scheduled_time = meeting.scheduled_time
            if timezone.is_naive(scheduled_time):
                scheduled_time = timezone.make_aware(scheduled_time, timezone=timezone.utc)

            if scheduled_time > now:
                return MeetingSerializer(meeting).data
        except Exception as e:
            print(f"Error fetching meeting for room {obj.id}: {e}")
        return None

class UserRoomsSerializer(serializers.Serializer):
    one_to_one = RoomSerializer(many=True)
    group = RoomSerializer(many=True)


# class UnreadMsgCountSerializer(serializers.Serializer):
#     un_read_messages = serializers.SerializerMethodField()

#     def get_un_read_messages(self, obj):
#         user_id = self.context.get('user_id')
#         user = User.objects.get(user_id = user_id)
#         un_read_messages_count = Message.objects(
#             room=obj,
#             is_read='no',
#             sender__ne=user,
#         ).count()
#         return un_read_messages_count

