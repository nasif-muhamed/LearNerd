from .models import AdminUser
import random
import time
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .tasks import send_otp_email

def is_admin(user):
    return AdminUser.objects.filter(profile=user).exists()

def generate_and_send_otp(email, flow='register'):
    otp = random.randint(100000, 999999)
    if flow == 'register':
        subject = 'Your One Time Password (OTP) for LearNerds'
        message = f'Your OTP code is {otp}'
    else:
        subject = 'Your One Time Password (OTP) for Password Reset'
        message = f'Your OTP code for password reset is {otp}'

    print(message)
    recipient_list = [email]
    send_otp_email.delay(subject, message, recipient_list)

    return otp, message


def get_cache_key(email, flow):
    return email if flow == 'register' else f"forgot_password_{email}"


def can_resend_otp(last_sent, cooldown=60):
    current_time = time.time()
    return (current_time - last_sent) >= cooldown


def handle_otp_resend(email, flow):
    cache_key = get_cache_key(email, flow)
    cache_data = cache.get(cache_key)

    if not cache_data:
        return None, 'No active session found. Please start the process again.'

    last_sent = cache_data.get('last_sent', 0)
    if not can_resend_otp(last_sent):
        remaining_time = int(60 - (time.time() - last_sent))
        return None, f'Please wait {remaining_time} seconds before resending OTP.'

    otp, message = generate_and_send_otp(email, flow)
    cache_data['otp'] = otp
    cache_data['last_sent'] = time.time()
    cache.set(cache_key, cache_data, timeout=180)

    return cache_data, None


def send_forgot_password_otp(email):
    otp = random.randint(100000, 999999)
    subject = 'Your One Time Password (OTP) for Password Reset'
    message = f'Your OTP code for password reset is {otp}'
    print(message)
    send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)

    cache_data = {
        'otp': otp,
        'last_sent': time.time()
    }
    cache.set(f"forgot_password_{email}", cache_data, timeout=180)

    return True


def verify_otp(email, otp, flow='register'):
    cache_key = get_cache_key(email, flow)
    cache_data = cache.get(cache_key)
    current_time = time.time()

    if not cache_data:
        return False, 'No active password reset session found. Please start the password reset process again.'

    if abs(current_time - cache_data['last_sent']) > 60:
        return False, 'OTP expired. Try resend OTP.'

    if cache_data['otp'] != int(otp):
        return False, 'Invalid OTP'

    return True, cache_data

class CustomPagination(PageNumberPagination):
    page_size = 3  # Default items per page
    page_size_query_param = 'page_size'  # Allow client to override page size
    max_page_size = 100  # Maximum limit for page_size

    def get_paginated_response(self, data):
            # Get the next and previous page numbers
            next_page = self.get_next_link()
            previous_page = self.get_previous_link()

            # Extract just the query parameters only, without domain specific url(http://localhost:80001).
            next_parts = next_page.split('?') if isinstance(next_page, str) else next_page
            previous_parts = previous_page.split('?') if isinstance(previous_page, str) else previous_page

            next_params = next_page if not isinstance(next_page, str) else next_parts[1] if len(next_parts) > 1 else ''
            previous_params = previous_page if not isinstance(previous_page, str) else previous_parts[1] if len(previous_parts) > 1 else ''

            return Response({
                'count': self.page.paginator.count,
                'next': next_params,
                'previous': previous_params,
                'results': data
            })
