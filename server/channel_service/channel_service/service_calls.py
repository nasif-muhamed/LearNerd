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
                timeout=10
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
    
