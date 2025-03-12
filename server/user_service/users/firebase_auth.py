import os
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings


# Get the directory where firebase_auth.py is located
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Get the BASE_DIR of the project. /app in case of docker /user_service incase of local device 
BASE_DIR = settings.BASE_DIR
print('BASE_DIR_firebase_auth:', BASE_DIR)

# Initialize Firebase Admin SDK
print('firebase_admin._apps:', firebase_admin._apps)
if not firebase_admin._apps:  # Prevent reinitialization
    cred_path = os.path.join(BASE_DIR, os.getenv('FIREBASE_CREDENTIALS_PATH')) # os.path.join(BASE_DIR, '..', 'keyfiles', 'learnerds-firbase-setup.json')
    print('cred_path:', cred_path)
    cred = credentials.Certificate(cred_path)
    print('cred', cred)
    firebase_admin.initialize_app(cred)
