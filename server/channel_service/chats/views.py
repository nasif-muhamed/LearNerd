import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from mongoengine.errors import DoesNotExist
from mongoengine.queryset.visitor import Q
from .models import Room, Message, User, Meeting
from .serializers import MessageSerializer, UserRoomsSerializer, RoomSerializer, MeetingSerializer
from .service import get_or_create_user, create_or_update_chat_room
from channel_service.service_calls import UserServiceException
from channel_service.permissions.permissions import IsUserAdmin

logger = logging.getLogger(__name__)

class UserRoomsView(APIView):
    def get(self, request):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            user_id = int(user_id)
            user, _ = get_or_create_user(user_id)            
            one_to_one_rooms = Room.objects(participants=user, room_type='one-to-one').order_by('-updated_at')
            group_rooms = Room.objects(participants=user, room_type='group').order_by('-updated_at')
            data = {
                'one_to_one': one_to_one_rooms,
                'group': group_rooms
            }
            serializer = UserRoomsSerializer(
                data, 
                context={'user_id': user_id}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            logger.exception("Unhandled exception in UserRoomsView GET")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class RoomMessagesView(APIView):
    def post(self, request, room_id):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)            
            user, _ = get_or_create_user(int(user_id))
            room = Room.objects.get(id=room_id)
            if user not in room.participants:
                return Response({"error": "User is not a participant in this room"}, status=status.HTTP_403_FORBIDDEN)            
            
            content = request.data.get('content')
            message_type = request.data.get('message_type') 
            if not content:
                return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not message_type or message_type not in ['text', 'image', 'video']:
                return Response({"error": "Invalid message type"}, status=status.HTTP_400_BAD_REQUEST)
            
            message = Message(
                sender=user,
                content=content,
                message_type=message_type,
                room=room
            )
            message.save()
            room.last_message = message
            room.updated_at = datetime.utcnow()
            room.save()
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError:
            return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception(f"Unexpected error in RoomMessagesView POST for room {room_id}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, room_id):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            user, _ = get_or_create_user(int(user_id))
            room = Room.objects.get(id=room_id)
            if user not in room.participants:
                return Response({"error": "User is not a participant in this room"}, status=status.HTTP_403_FORBIDDEN)
            
            messages = Message.objects(room=room).order_by('timestamp')
            message_serializer = MessageSerializer(messages, many=True)
            meeting = Meeting.objects(
                group=room,
                status__nin=['cancelled', 'completed'],
            ).order_by('-created_at').first()
            meeting_serializer = MeetingSerializer(meeting)
            return Response({'meeting': meeting_serializer.data if meeting else None, 'messages': message_serializer.data}, status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Unexpected error in RoomMessagesView GET for room {room_id}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UnreadMeassageCountView(APIView):
    def get(self, request):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({'error': 'Unauthorized Request'}, status=status.HTTP_401_UNAUTHORIZED)
            user, _ = get_or_create_user(int(user_id))
            rooms = Room.objects(participants=user)
            unread_counts = {}
            for room in rooms:
                unread_count = Message.objects(
                    Q(room=room) &
                    Q(is_read='no') &
                    Q(sender__ne=user)
                ).count()
                if unread_count > 0:
                    unread_counts[str(room.id)] = unread_count
            return Response(unread_counts)

        except ValueError:
            return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            logger.exception("Unexpected error in UnreadMessageCountView")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FetchRoomIdView(APIView):
    def get(self, request, participant_id):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({'error': 'Unauthorized Request'}, status=status.HTTP_401_UNAUTHORIZED)
            user, _ = get_or_create_user(int(user_id))
            participant, _ = get_or_create_user(int(participant_id))
            room = Room.objects(
                room_type='one-to-one',
                participants__all=[user, participant],
            ).first()

            if room is None:
                return Response({'error': 'No room exist'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'room_id': str(room.id)})

        except ValueError:
            return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            logger.exception(f"Unexpected error in FetchRoomIdView for participant_id={participant_id}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminFetchRoomIdView(APIView):
    permission_classes = [IsUserAdmin]

    def get(self, request, participant_id):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({'error': 'Unauthorized Request'}, status=status.HTTP_401_UNAUTHORIZED)
            user, _ = get_or_create_user(int(user_id))
            participant, _ = get_or_create_user(int(participant_id))
            room = Room.objects(
                room_type='one-to-one',
                participants__all=[user, participant],
            ).first()
            if room is None:
                new_room = Room(
                    room_type="one-to-one",
                    participants=[user, participant],
                    temp_chat=True,
                )
                new_room.save()
                return Response({'room_id': str(new_room.id)})
            return Response({'room_id': str(room.id)})

        except ValueError:
            return Response({"error": "Invalid user_id format"}, status=status.HTTP_400_BAD_REQUEST)
        except UserServiceException as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            logger.exception(f"Unexpected error in AdminFetchRoomIdView for participant_id={participant_id}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
