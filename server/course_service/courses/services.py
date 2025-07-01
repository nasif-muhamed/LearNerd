import os
import requests
from rest_framework import status
from rest_framework.exceptions import APIException

class UserServiceException(APIException):
    """Custom exception for user service related errors"""
    default_detail = 'User service operation failed'
    default_code = 'user_service_error'

class CallUserService:
    USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
    
    def __init__(self):
        if not self.USER_SERVICE_URL:
            raise ValueError("USER_SERVICE_URL environment variable is not set")

    def _make_request(self, method, headers=None, path=None, data=None, url=None):
        if not url:
            url = self.USER_SERVICE_URL + path

        try:
            return requests.request(
                method,
                url,
                json=data,
                headers=headers,
                timeout=10  # timeout to prevent hanging
            )
        
        except requests.exceptions.RequestException as e:
            raise UserServiceException(f"Request failed: {str(e)}")

    def get_user_details(self, pk):
        if not pk:
            raise ValueError("user identifier is required")

        path = f"api/v1/users/user-detail/{pk}/"

        try:
            response = self._make_request("GET", path=path)
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")

    def get_users_details(self, ids):
        if not ids:
            raise ValueError("user identifiers are required")

        path = "api/v1/users/tutor-details/"

        try:
            response = self._make_request("GET", path=path, data={"ids": ids})
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")
        
    def get_user_wallet(self, id):
        if not id:
            raise ValueError("user identifier is required")

        path = f"api/v1/users/user-wallet/{id}/"
        try:
            response = self._make_request("GET", path=path)
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")

    def get_user_badge_exist(self, user_id, badge_id):
        if not user_id or not badge_id:
            raise ValueError("user_id and badge_id are required")

        path = f"api/v1/users/user-badge-exist/"
        data = {
            "user_id": user_id,
            "badge_id": badge_id
        }
        
        try:
            response = self._make_request("GET", path=path, data=data)
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")