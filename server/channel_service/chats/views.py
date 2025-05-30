from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from mongoengine.errors import DoesNotExist
from mongoengine.queryset.visitor import Q
from .models import Room, Message, User
from .serializers import MessageSerializer, UserRoomsSerializer
from .service import get_or_create_user, create_or_update_chat_room
from channel_service.service_calls import UserServiceException
from channel_service.permissions.permissions import IsUserAdmin

class UserRoomsView(APIView):
    def get(self, request):
        print('user_payload:', request.user_payload) 
        
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = int(user_id)
            # fetch or create user
            user, _ = get_or_create_user(user_id)
            
            # Fetch rooms and split by type
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
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class RoomMessagesView(APIView):
    def post(self, request, room_id):
        try:
            # Get user_id from payload
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Fetch or create user
            user, _ = get_or_create_user(int(user_id))
            print('user_+++++++++:', user)

            # Fetch room and verify user is a participant
            room = Room.objects.get(id=room_id)
            print('room_+++++++++:', room)
            if user not in room.participants:
                return Response({"error": "User is not a participant in this room"}, status=status.HTTP_403_FORBIDDEN)
            
            # Validate request data
            print('request.data:', request.data)
            content = request.data.get('content')
            message_type = request.data.get('message_type')
            
            if not content:
                return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not message_type or message_type not in ['text', 'image', 'video']:
                return Response({"error": "Invalid message type"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create new message
            message = Message(
                sender=user,
                content=content,
                message_type=message_type,
                room=room
            )
            message.save()
            
            # Update room's last_message and updated_at
            room.last_message = message
            room.updated_at = datetime.utcnow()
            room.save()
            
            # Serialize and return the new message
            serializer = MessageSerializer(message)
            print('serializer:', serializer.data)
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
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, room_id):
        try:
            # Get user_id from payload
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Fetch or create user
            user, _ = get_or_create_user(int(user_id))

            # Fetch room to verify it exists
            room = Room.objects.get(id=room_id)

            # Error response if user not in participants
            if user not in room.participants:
                return Response({"error": "User is not a participant in this room"}, status=status.HTTP_403_FORBIDDEN)
            
            messages = Message.objects(room=room).order_by('timestamp')
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# not using yet. can delete.
class MarkMessagesReadView(APIView):

    def post(self, request, room_id):
        try:
            user_id = request.user_payload.get('user_id')
            if not user_id:
                return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Fetch or create user
            user, _ = get_or_create_user(int(user_id))
            room = Room.objects.get(id=room_id)

            if room.room_type != 'one-to-one':
                return Response({"error": "Marking messages as read is only supported for one-to-one rooms"}, status=status.HTTP_400_BAD_REQUEST)

            if user not in room.participants:
                return Response({"error": "User is not a participant in this room"}, status=status.HTTP_403_FORBIDDEN)

            messages_to_update = Message.objects(
                room=room,
                is_read='no',
                sender__ne=user
            )

            serializer = MessageSerializer(messages_to_update, many=True)

            messages_to_update.update(set__is_read='yes')

            return Response(status=200)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=404)
        except Exception as e:
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
            print('room:', room)
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
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
