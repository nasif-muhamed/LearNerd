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
    cred_dict = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
        "universe_domain": os.getenv("FIREBASE_UNIVERSE_DOMAIN")
    }
    # cred_path = os.path.join(BASE_DIR, os.getenv('FIREBASE_CREDENTIALS_PATH')) # os.path.join(BASE_DIR, '..', 'keyfiles', 'learnerds-firbase-setup.json')
    print('cred_dict:', cred_dict)
    cred = credentials.Certificate(cred_dict)
    print('cred', cred)
    firebase_admin.initialize_app(cred)
