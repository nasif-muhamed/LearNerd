from mongoengine.errors import DoesNotExist, ValidationError
from .models import User, Room, Message
from channel_service.service_calls import CallUserService, UserServiceException
from django.db import DatabaseError
from datetime import datetime, timezone

call_user_service = CallUserService()

def create_or_update_user(user_id, email, first_name, last_name, image_url):
    try:
        user_id = int(user_id)
        full_name = f"{first_name} {last_name}".strip()

        try:
            user = User.objects.get(user_id=user_id)
            print('user found:', user)
            created = False
        except DoesNotExist:
            print('user not found:')
            user = User(user_id=user_id, email=email)
            created = True

        # Check for changes
        change = False
        if user.full_name != full_name:
            user.full_name = full_name
            change = True
        if user.image != image_url:
            user.image = image_url
            change = True

        # Save if there are changes or if it's a new user
        if change or created:
            try:
                user.save()
            except ValidationError as ve:
                raise

        return user, created

    except ValidationError as e:
        print(f"Validation error getting or creating user: {e}")
        return None, False
    except ValueError as e:
        print(f"Value error (likely invalid user_id): {e}")
        return None, False
    except Exception as e:
        print(f"Error getting or creating user: {e}")
        return None, False
    
def get_or_create_user(user_id):
    print(f"get_or_create_user: user_id={user_id}")
    try:
        print("Querying user...")
        user = User.objects.get(user_id=user_id)
        print(f"User found: {user.to_json()}")
        return user, False
    except DoesNotExist:
        print("User does not exist, creating...")
        try:
            response_user_service = call_user_service.get_user_details(user_id)
            print(f"User service response: {response_user_service.text}")
            if response_user_service.status_code != 200:
                raise UserServiceException(f"User service error: {response_user_service.text}")
            user_data = response_user_service.json()
            print(f"User data: {user_data}")
            user_id = int(user_data['id'])
            email = user_data['email']
            first_name = user_data['first_name']
            last_name = user_data['last_name']
            image_url = user_data['image']
            full_name = f"{first_name} {last_name}".strip()
            user = User(user_id=user_id, full_name=full_name, email=email, image=image_url)
            print(f"Attempting to save user: {user.to_json()}")
            user.save()
            print("User saved successfully")
            return user, True
        except UserServiceException as e:
            raise
        except Exception as e:
            raise UserServiceException(f"Unexpected error while creating user: {str(e)}")
                
def create_or_update_chat_room(student_id, tutor_id, expiry_date):
    try:
        student_id = int(student_id)
        tutor_id = int(tutor_id)
        expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        print('create_or_update_chat_room:', student_id, tutor_id, expiry_dt)
        if expiry_dt <= datetime.now(timezone.utc):
            raise UserServiceException("Expiry date must be in the future")

        student, _ = get_or_create_user(student_id)
        tutor, _ = get_or_create_user(tutor_id)
        try:
            room = Room.objects(
                room_type="one-to-one",
                participants__all=[student, tutor]
            ).get()
            print('Chat room found:', room.to_json())
            created = False
            if room.expires_at and expiry_dt > room.expires_at:
                room.expires_at = expiry_dt
                room.save()

        except DoesNotExist:
            # Create a new channel
            print('Creating new chat room...')
            room = Room(
                room_type="one-to-one",
                participants=[student, tutor],
                expires_at=expiry_dt,
            )
            room.save()
            created = True
            print(f"Chat room created: {room.to_json()}")
        return room, created
    
    except UserServiceException as e:
        raise  # Re-raise user service errors
    except DatabaseError as e:
        raise UserServiceException(f"Database error while managing chat room: {str(e)}")
    except Exception as e:
        raise UserServiceException(f"Unexpected error in chat room operation: {str(e)}")

