import os
import requests
from rest_framework import status
from rest_framework.exceptions import APIException
from .models import UserServiceToken

class UserServiceException(APIException):
    """Custom exception for user service related errors"""
    default_detail = 'User service operation failed'
    default_code = 'user_service_error'

class CallUserService:
    USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
    
    def __init__(self):
        if not self.USER_SERVICE_URL:
            raise ValueError("USER_SERVICE_URL environment variable is not set")

    # Helper method to make HTTP requests with proper timeout
    def _make_request(self, method, headers, path=None, data=None, url=None):
        print('inside make reqeust')
        if not url:
            url = self.USER_SERVICE_URL + path
        print('urls:', url, headers, data)
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

    # Helper method to refresh token
    def _refresh_token(self, token_obj):
        try:
            refresh_response = requests.post(
                f"{self.USER_SERVICE_URL}api/v1/users/token/refresh/",
                json={"refresh": token_obj.refresh_token},
                timeout=10
            )
            if refresh_response.status_code != status.HTTP_200_OK:
                raise UserServiceException(
                    f"Token refresh failed with status: {refresh_response.status_code}"
                )
            return refresh_response.json()
        except requests.exceptions.RequestException as e:
            raise UserServiceException(f"Token refresh request failed: {str(e)}")

    # method to aquire access and refresh tokens
    def get_tokens(self, method="POST", data=None):
        path = "api/v1/users/token/"
        headers = {"Content-Type": "application/json"}

        try:
            response = self._make_request(method, headers, path, data)
            
            if response.status_code != status.HTTP_200_OK:
                raise UserServiceException(
                    f"Failed to obtain tokens with status {response.status_code}: {response.text}"
                )
            
            return response
        
        except UserServiceException as e:
            raise e
        
        except Exception as e:
            raise UserServiceException(f"Unexpected error while getting tokens: {str(e)}")

    # method to fetch a single user
    def get_user(self, pk, admin):
        if not admin:
            raise ValueError("Admin parameter is required")

        try:
            token_obj = UserServiceToken.objects.get(admin=admin)
        except UserServiceToken.DoesNotExist:
            raise UserServiceException("Token not found for admin")

        path = f"api/v1/users/user-action/{pk}/"
        headers = {"Authorization": f"Bearer {token_obj.access_token}"}

        try:
            response = self._make_request("GET", headers, path)
            
            if response.status_code == 401:
                # Handle token refresh in case of access token expiration
                new_token = self._refresh_token(token_obj)
                token_obj.access_token = new_token["access"]
                token_obj.save()
                
                # Retry with new access token
                headers["Authorization"] = f"Bearer {new_token['access']}"
                response = self._make_request("GET", headers, path)

            print('response.ok:', response.ok)
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")

    # method to bloack a user
    def block_user(self, pk, method="PATCH", data=None, admin=None):
        if not admin:
            raise ValueError("Admin parameter is required")

        try:
            token_obj = UserServiceToken.objects.get(admin=admin)
        except UserServiceToken.DoesNotExist:
            raise UserServiceException("Token not found for admin")

        path = f"api/v1/users/user-action/{pk}/"
        headers = {"Authorization": f"Bearer {token_obj.access_token}"}

        try:
            response = self._make_request(method, headers, path, data)
            
            if response.status_code == 401:
                # Handle token refresh in case of access token expiration
                new_token = self._refresh_token(token_obj)
                token_obj.access_token = new_token["access"]
                token_obj.save()
                
                # Retry with new access token
                headers["Authorization"] = f"Bearer {new_token['access']}"
                response = self._make_request(method, headers, path, data)

            print(response.ok)
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")
        
    # method to fetch users, supports filters. For Admin only, lists all users
    def get_users(self, admin, query_params=None):
        print('HEre,', query_params)
        if not admin:
            raise ValueError("Admin parameter is required")

        try:
            token_obj = UserServiceToken.objects.get(admin=admin)
        except UserServiceToken.DoesNotExist:
            raise UserServiceException("Token not found for admin")

        path = "api/v1/users/"
        url = f"{self.USER_SERVICE_URL}{path}"
        if query_params:
            url = f"{url}?{query_params}"# f"{url}?{requests.utils.urlencode(query_params)}"
        headers = {"Authorization": f"Bearer {token_obj.access_token}"}

        try:
            response = self._make_request("GET", headers=headers, url=url)
            
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                new_tokens = self._refresh_token(token_obj)
                token_obj.access_token = new_tokens["access"]
                token_obj.save()
                headers["Authorization"] = f"Bearer {new_tokens['access']}"
                response = self._make_request("GET", headers=headers, url=url)

            if not response.ok:
                raise UserServiceException(
                    f"Failed to fetch users with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise
        except Exception as e:
            raise UserServiceException(f"Unexpected error fetching users: {str(e)}")
        
    # to get all notifications for admin
    def get_my_notifications(self, admin, query_params=None):
        print('Here in get_my_notifications:', query_params)
        if not admin:
            raise ValueError("Admin parameter is required")

        try:
            token_obj = UserServiceToken.objects.get(admin=admin)
        except UserServiceToken.DoesNotExist:
            raise UserServiceException("Token not found for admin")

        path = "api/v1/users/notifications/"
        url = f"{self.USER_SERVICE_URL}{path}"
        if query_params:
            url = f"{url}?{query_params}"# f"{url}?{requests.utils.urlencode(query_params)}"
        headers = {"Authorization": f"Bearer {token_obj.access_token}"}

        try:
            response = self._make_request("GET", headers=headers, url=url)
            
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                new_tokens = self._refresh_token(token_obj)
                token_obj.access_token = new_tokens["access"]
                token_obj.save()
                headers["Authorization"] = f"Bearer {new_tokens['access']}"
                response = self._make_request("GET", headers=headers, url=url)

            if not response.ok:
                raise UserServiceException(
                    f"Failed to fetch users with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise
        except Exception as e:
            raise UserServiceException(f"Unexpected error fetching users: {str(e)}")

    # accessed by 
    def get_users_details(self, ids):
        # print('here in get_tutor_detail', ids)
        if not ids:
            raise ValueError("user identifiers are required")

        path = "api/v1/users/tutor-details/"
        print('paht::', path)
        try:
            response = self._make_request("GET", headers=None, path=path, data={"ids": ids})
            if response.status_code != 200:
                raise UserServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except UserServiceException as e:
            raise

        except Exception as e:
            raise UserServiceException(f"Unexpected error: {str(e)}")


class CourseServiceException(APIException):
    """Custom exception for course service related errors"""
    default_detail = 'Course service operation failed'
    default_code = 'course_service_error'

class CallCourseService:
    COURSE_SERVICE_URL = os.getenv('COURSE_SERVICE_URL')

    def __init__(self):
        if not self.COURSE_SERVICE_URL:
            raise ValueError("COURSE_SERVICE_URL environment variable is not set")

    # Helper method to make HTTP requests with proper timeout
    def _make_request(self, method, headers, path=None, data=None, url=None):
        print('inside make reqeust')
        if not url:
            url = self.COURSE_SERVICE_URL + path
        print('urls:', url)
        try:
            return requests.request(
                method,
                url,
                json=data,
                headers=headers,
                timeout=10
            )
        except requests.exceptions.RequestException as e:
            raise CourseServiceException(f"Request failed: {str(e)}")

    # method to fetch a all reports from course service
    def get_all_reports(self, request, query_params=None):
        path = f"api/v1/courses/admin/all-reports/"
        headers = {"Authorization": request.META.get('HTTP_AUTHORIZATION')}
        if query_params:
            path = f"{path}?{query_params}"# f"{url}?{requests.utils.urlencode(query_params)}"
        print('path:', path)
        print('headers:', headers)
        try:
            response = self._make_request("GET", headers, path)
            
            print('response:', response.json())
            print('response.ok:', response.ok)
            if response.status_code != 200:
                raise CourseServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except CourseServiceException as e:
            raise

        except Exception as e:
            raise CourseServiceException(f"Unexpected error: {str(e)}")

    def update_report(self, request, pk, method, data):
        path = f"api/v1/courses/admin/report/{pk}/"
        headers = {"Authorization": request.META.get('HTTP_AUTHORIZATION')}
        try:
            response = self._make_request(method, headers, path, data)
            
            if response.status_code != 200:
                raise CourseServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except CourseServiceException as e:
            raise

        except Exception as e:
            raise CourseServiceException(f"Unexpected error: {str(e)}")