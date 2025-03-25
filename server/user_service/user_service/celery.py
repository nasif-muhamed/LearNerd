import os
from celery import Celery

# Set the default Django settings module for the 'celery' program. For command line tools and more
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_service.settings')

app = Celery('user_service')

# Load task modules from all registered Django app configs.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')