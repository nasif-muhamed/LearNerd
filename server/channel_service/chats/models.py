from mongoengine import Document, StringField, ListField, ReferenceField, DateTimeField, IntField, BooleanField
from datetime import datetime

class User(Document):
    user_id = IntField(required=True, unique=True, primary_key=True)
    email = StringField(required=True, max_length=100, unique=True)
    full_name = StringField(max_length=100)
    image = StringField(max_length=255)
    is_admin = StringField(choices=['yes', 'no'], default='no') 

    meta = {
        'collection': 'users',
        'auto_create_index': False,
        'indexes': []
    }

class Room(Document):
    room_type = StringField(choices=['one-to-one', 'group'], required=True)
    participants = ListField(ReferenceField(User), required=True)
    name = StringField(max_length=100)
    image = StringField(max_length=255)
    last_message = ReferenceField('Message')
    expires_at = DateTimeField(tz_aware=True)
    created_at = DateTimeField(default=datetime.utcnow, tz_aware=True)
    updated_at = DateTimeField(default=datetime.utcnow, tz_aware=True)
    temp_chat = BooleanField(default=False) 
    
    meta = {
        'collection': 'rooms',
        'indexes': ['participants', 'room_type', 'updated_at']
    }

class Message(Document):
    sender = ReferenceField(User, required=True)
    content = StringField(required=True)
    message_type = StringField(choices=['text', 'image', 'video'], required=True)
    is_read = StringField(choices=['yes', 'no'], default='no')
    timestamp = DateTimeField(default=datetime.utcnow)
    room = ReferenceField(Room, required=True)
    
    meta = {
        'collection': 'messages',
        'indexes': ['room', 'timestamp']
    }


class Meeting(Document):
    group = ReferenceField(Room, required=True)
    title = StringField(required=True)
    scheduled_time = DateTimeField(default=datetime.utcnow, tz_aware=True)
    
    meta = {
        'collection': 'meetings',
        'ordering': ['-scheduled_time'],
    }

