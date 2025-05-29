from mongoengine.errors import DoesNotExist, ValidationError
from mongoengine import Q
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
                
def create_or_update_chat_room(student_id, tutor_id, expiry_date, temporary=None):
    try:
        student_id = int(student_id)
        tutor_id = int(tutor_id)
        expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00')) if expiry_date is not None else None
        print('create_or_update_chat_room:', student_id, tutor_id, expiry_dt, temporary)
        if expiry_dt is not None and expiry_dt <= datetime.now(timezone.utc):
            raise UserServiceException("Expiry date must be in the future")

        student, _ = get_or_create_user(student_id)
        tutor, _ = get_or_create_user(tutor_id)
        try:
            room = Room.objects(
                room_type="one-to-one",
                participants__all=[student, tutor]
            ).get()
            print('Chat room found:')

            created = False
            if expiry_date is not None and room.expires_at:
                expires_at_aware = room.expires_at.replace(tzinfo=timezone.utc) if room.expires_at.tzinfo is None else room.expires_at

                if expiry_dt > expires_at_aware:
                    room.expires_at = expiry_dt
                    room.save()

            if temporary is not None:
                room.temp_chat = temporary
                room.save()
            print('Chat room found:', room.to_json())
                

        except DoesNotExist:
            # Create a new channel
            print('Creating new chat room...')
            room = Room(
                room_type="one-to-one",
                participants=[student, tutor],
                expires_at=expiry_dt,
            )
            if temporary is not None:
                room.temp_chat = temporary
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

def create_or_update_group_chat_room(name, image, admin):
    try:
        admin_id = int(admin['id'])
        user = User.objects.get(user_id=admin_id)
    except DoesNotExist:
        email = admin['email']
        first_name = 'admin'
        last_name = str(admin_id)
        image_url = admin['image']
        full_name = f"{first_name} {last_name}".strip()
        user = User(user_id=admin_id, full_name=full_name, email=email, image=image_url)
        print(f"Attempting to save user: {user.to_json()}")
        user.save()
    try:
        room = Room.objects(
            room_type="group",
            name=name,
        ).get()
        print('Group room found:', room.to_json())
        created = False
        changed = False
        if name is not None and room.name != name:
            room.name = name
            changed = True
        if image is not None and room.image != image:
            room.image = image
            changed = True
        if changed:
            room.save()

    except DoesNotExist:
        # Create a new channel
        print('Creating new group chat room...')
        room = Room(
            room_type="group",
            name=name,
            image=image,
            participants=[user,],
        )
        room.save()
        created = True
        print(f"Chat room created: {room.to_json()}")

    except Exception as e:
        raise Exception(f"Unexpected error in group chat room operation: {str(e)}")
    
    return room, created
    
def add_to_group_chat(user_id, badge_title):
    try:
        user_id = int(user_id)
        print('add_to_group_chat:', user_id)
        user, _ = get_or_create_user(user_id)
        print('user fount in add_to_group_chat:', user)
        room = Room.objects(
            room_type="group",
            name=badge_title
        ).get()
        print('Chat room found:', room.to_json())
        added = False
        if user not in room.participants:
            room.update(
                push__participants=user,
                set__updated_at=datetime.utcnow()
            )
            added = True
        room.reload()
        return room, added

    except DoesNotExist:
        raise 
    except UserServiceException as e:
        raise  # Re-raise user service errors
    except DatabaseError as e:
        raise Exception(f"Database error while managing chat room: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error in chat room operation: {str(e)}")
