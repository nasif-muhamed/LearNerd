
import os
# import logging
import cloudinary.uploader
from django.conf import settings
from django.utils import timezone
from rest_framework.response import Response
from .models import SectionItem, VideoUpload
from .services import CallUserService, UserServiceException

# logger = logging.getLogger(__name__)
call_user_service = CallUserService()

def mark_purchase_completed(purchase):
    course = purchase.course
    section_item_count = SectionItem.objects.filter(section__course=course).count()
    section_items_completed_count = purchase.section_items_completed.count()
    if section_item_count == section_items_completed_count and not purchase.completed:
        purchase.completed = True
        purchase.save()

def handle_thumbnail_upload(thumbnail_file, existing_thumbnail=None):
    """
    Upload a new thumbnail to Cloudinary and delete the old one if it exists.
    """
    try:
        if existing_thumbnail:
            public_id = "Course/Thumbnail/" + existing_thumbnail.split('/')[-1].split('.')[0]
            cloudinary.uploader.destroy(public_id)
        
        upload_result = cloudinary.uploader.upload(
            thumbnail_file,
            folder="Course/Thumbnail/"
        )
        return upload_result.get('secure_url')
    except Exception as e:
        raise Exception(f"Error handling thumbnail: {str(e)}")

def handle_chunk_upload(upload_id, chunk_number, total_chunks, chunk, file_name):
    """
    Handle chunk upload, storage, and assembly for video files.
    Returns a dictionary with message, upload_id, and chunks_uploaded.
    """
    video_upload, created = VideoUpload.objects.get_or_create(
        upload_id=upload_id,
        defaults={'file_name': file_name, 'total_chunks': total_chunks}
    )

    # Define temporary chunk storage path
    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', str(upload_id))
    os.makedirs(temp_dir, exist_ok=True)
    chunk_path = os.path.join(temp_dir, f'chunk_{chunk_number}')

    # Save chunk to temporary storage
    with open(chunk_path, 'wb') as f:
        for chunk_data in chunk.chunks():
            f.write(chunk_data)

    # Update chunks_uploaded count
    video_upload.chunks_uploaded += 1
    video_upload.save()

    # Check if all chunks are uploaded
    if video_upload.chunks_uploaded == video_upload.total_chunks:
        # Assemble chunks into final file
        final_path = os.path.join(settings.MEDIA_ROOT, 'course_videos', f"{upload_id}_{file_name}_{timezone.now().strftime('%Y%m%d%H%M%S')}")
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'course_videos'), exist_ok=True)
        with open(final_path, 'wb') as final_file:
            for i in range(1, total_chunks + 1):
                chunk_path = os.path.join(temp_dir, f'chunk_{i}')
                with open(chunk_path, 'rb') as chunk_file:
                    final_file.write(chunk_file.read())
                os.remove(chunk_path)  # Clean up chunk

        # Update video_upload with final file path
        video_upload.file_path = final_path
        video_upload.save()
        # Clean up temp directory
        os.rmdir(temp_dir)

    return {
        'message': 'Chunk uploaded successfully',
        'upload_id': upload_id,
        'chunks_uploaded': video_upload.chunks_uploaded
    }

def get_tutor_details(users):
    user_ids = [user['instructor'] for user in users]
    try:
        response_user_service = call_user_service.get_users_details(user_ids)
    except UserServiceException as e:
        return None, Response({"error": str(e)}, status=503)
    except Exception as e:
        return None, Response({"error": f"Unexpected error: {str(e)}"}, status=500)

    users_data = response_user_service.json()
    # Validate that the number of tutor details matches the number of tutors
    if len(users_data) != len(users):
        return None, Response(
            {"error": "Mismatch between number of tutors and tutor details returned."},
            status=500
        )

    result = [
        {
            'tutor_id': user['instructor'],
            'course_count': user['total_courses'],
            'enrollment_count': user['total_enrollments'],
            'tutor_details': details
        }
        for user, details in zip(users, users_data)
    ]
    return result, None