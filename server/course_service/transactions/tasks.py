from celery import shared_task
from django.core.management import call_command

@shared_task
def run_safe_period_check():
    call_command('release_funds')
    