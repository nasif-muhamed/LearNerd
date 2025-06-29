import os
import requests
from rest_framework import status
from rest_framework.exceptions import APIException

class CourseServiceException(APIException):
    """Custom exception for Course service related errors"""
    default_detail = 'Course service operation failed'
    default_code = 'course_service_error'

class CallCourseService:
    COURSE_SERVICE_URL = os.getenv('COURSE_SERVICE_URL')
    
    def __init__(self):
        if not self.COURSE_SERVICE_URL:
            raise ValueError("COURSE_SERVICE_URL environment variable is not set")

    def _make_request(self, method, headers=None, path=None, data=None, url=None):
        if not url:
            url = self.COURSE_SERVICE_URL + path

        try:
            return requests.request(
                method,
                url,
                json=data,
                headers=headers,
                timeout=10  # timeout to prevent hanging
            )
        
        except requests.exceptions.RequestException as e:
            raise CourseServiceException(f"Request failed: {str(e)}")

    def get_tutor_course_details(self, pk):
        if not pk:
            raise ValueError("user identifier is required")

        path = f"api/v1/courses/tutor/course-details/{pk}/"

        try:
            response = self._make_request("GET", path=path)
            if response.status_code != 200:
                raise CourseServiceException(
                    f"Request failed with status {response.status_code}: {response.text}"
                )

            return response

        except CourseServiceException as e:
            raise

        except Exception as e:
            raise CourseServiceException(f"Unexpected error: {str(e)}")
