import requests
import os
import logging

from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.shortcuts import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .utils import get_forwarded_headers

logger = logging.getLogger(__name__)

# URLs of the other services
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
#'http://host.docker.internal:8001/' # 'http://localhost:8001/'  
ADMIN_SERVICE_URL = os.getenv('ADMIN_SERVICE_URL')
# 'http://host.docker.internal:8002/' # 'http://localhost:8002/'
COURSE_SERVICE_URL = os.getenv('COURSE_SERVICE_URL') 
# 'http://host.docker.internal:8003/' # 'http://localhost:8003/'
CHANNEL_SERVICE_URL = os.getenv('CHANNEL_SERVICE_URL') 
# 'http://host.docker.internal:8004/' # 'http://localhost:8004/'

# proxy to User Service User Profile - contains media files
class UserProfileGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Forward multipart data

    def get(self, request):
        url = USER_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")  # Forward JWT
        }
        logger.info(f"GET request to UserProfileGateway: {url}")
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json() 
            logger.debug(f"Response from user service: {json_data}")
            if json_data.get('image'):
                json_data['image'] = request.build_absolute_uri('/')[:-1] + json_data['image']
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch profile from {url}: {str(e)}")
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request):
        url = USER_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        # Forward files and data
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"PATCH request to UserProfileGateway: {url}, Files: {files.keys()}, Data: {data}")
        try:
            response = requests.patch(url, headers=headers, data=data, files=files)
            response.raise_for_status()  # Raise exception for 4xx/5xx
            logger.info(f"Successful PATCH response: {response.status_code}")
            return Response(response.json(), status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update profile at {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
# Proxy view to User Service
@api_view(['GET', 'POST', 'PATCH'])
def proxy_to_user_service(request):
    url = USER_SERVICE_URL + request.path
    query_params = request.GET.urlencode()  # Get query parameters as a URL-encoded string
    if query_params:
        url = f"{url}?{query_params}"  # Append the query parameters to the URL
    logger.info(f"Proxy to user service: {request.method} {url}, Data: {request.data}, Files: {request.FILES.keys()}")
    response = requests.request(
        method=request.method,
        url=url,
        headers=request.headers,
        json=request.data,
    )
    logger.debug(f"User service response: {response.status_code}, Content: {response.content}")    
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers['Content-Type']
    )

# Proxy view to Product Service
@api_view(['GET', 'POST', 'PATCH'])
def proxy_to_admin_service(request):
    url = ADMIN_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"
    logger.info(f"Proxy to admin service: {request.method} {url}")
    response = requests.request(
        method=request.method,
        url=url,
        headers=request.headers,
        json=request.data,
    )
    logger.debug(f"Admin service response: {response.status_code}, Content: {response.content}")
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers['Content-Type']
    )

@api_view(['GET', 'POST', 'PATCH', 'PUT'])
def proxy_to_badges_service(request):
    url = ADMIN_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"
    logger.info(f"Proxy to badges service: {request.method} {url}, Files: {request.FILES.keys()}, Data: {request.POST}")
    headers = {key: value for key, value in request.headers.items() if key.lower() not in ['host', 'content-length', 'content-type']}
    headers['Content-Type'] = request.headers.get('Content-Type')  # Preserve original Content-Type

    if request.method in ['POST', 'PATCH']:
        if request.FILES or 'multipart/form-data' in request.headers.get('Content-Type', ''):
            files = {key: (file.name, file, file.content_type) for key, file in request.FILES.items()}
            data = request.POST  # Pass QueryDict directly instead of dict()
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                data=data,  # Use QueryDict to preserve structure
                files=files,
            )
        else:
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                json=request.data,
            )
    else:
        response = requests.request(
            method=request.method,
            url=url,
            headers=headers,
        )

    logger.debug(f"Badges service response: {response.status_code}, Content: {response.text}")
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers.get('Content-Type', 'application/json'),
    )

class BadgeGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        url = ADMIN_SERVICE_URL + request.path
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        logger.info(f"GET request to BadgeGateway: {url}")
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            json_data = response.json()
            logger.debug(f"Badge service response: {response.status_code}, Content: {json_data}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch badge from {url}: {str(e)}")
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        url = ADMIN_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"POST request to BadgeGateway: {url}, Files: {files.keys()}, Data: {data}")
        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            logger.info(f"Successful POST response: {response.status_code}")
            response.raise_for_status()
            return Response({'message': 'user updated successfully'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update badge at {url}: {str(e)}")
            try:
                error_data = response.json()  # Try to parse error details
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SingleBadgeGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id):
        url = ADMIN_SERVICE_URL + request.path
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        logger.info(f"GET request to SingleBadgeGateway: {url}")
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            json_data = response.json()
            logger.debug(f"Single badge response: {response.status_code}, Content: {json_data}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch single badge from {url}: {str(e)}")
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, id):
        url = ADMIN_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"PATCH request to SingleBadgeGateway: {url}, Files: {files.keys()}, Data: {data}")
        try:
            response = requests.patch(url, headers=headers, data=data, files=files)
            logger.info(f"Successful PATCH response: {response.status_code}")
            response.raise_for_status()
            return Response({'message': 'user updated successfully'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update single badge at {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MediaProxyView(APIView):
    SERVICE_MAP = {
        'user': USER_SERVICE_URL,
        'admin': ADMIN_SERVICE_URL,
    }

    def get(self, request, path):
        # Split path to extract service prefix (e.g., 'user/profile/images/...')
        parts = path.split('/', 1)  # ['user', 'profile/images/...']
        if len(parts) < 2:
            return Response({"error": "Invalid media path"}, status=status.HTTP_400_BAD_REQUEST)

        service_prefix = parts[0]
        base_url = self.SERVICE_MAP.get(service_prefix)

        if not base_url:
            logger.warning(f"Service not found for prefix: {service_prefix}")
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

        media_url = f"{base_url}media/{path}"
        logger.info(f"GET request to MediaProxyView: {media_url}")
        headers = {"Authorization": request.headers.get("Authorization")}
        try:
            response = requests.get(media_url, headers=headers, stream=True)
            response.raise_for_status()
            logger.debug(f"Media service response: {response.status_code}, Content-Type: {response.headers['Content-Type']}")
            return HttpResponse(response.content, content_type=response.headers['Content-Type'])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch media from {media_url}: {str(e)}")
            return Response({"error": "Media not found"}, status=status.HTTP_404_NOT_FOUND)
        
@api_view(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])
def proxy_to_course_service(request):
    url = COURSE_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"
    logger.info(f"Proxy to course service: {request.method} {url}, Files: {request.FILES.keys()}, Data: {request.data}")
    headers = get_forwarded_headers(request)

    if request.method in ['POST', 'PATCH']:
        if request.FILES or 'multipart/form-data' in request.headers.get('Content-Type', ''):
            files = {key: (file.name, file, file.content_type) for key, file in request.FILES.items()}
            data = request.POST
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                data=data,
                files=files,
            )
        else:
            logger.debug("Not multipart data, sending JSON")
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                json=request.data,
            )
    else:
        response = requests.request(
            method=request.method,
            url=url,
            headers=headers,
        )

    if response.status_code == 204:
        logger.info("Received 204 No Content response")
        return Response(status=response.status_code)

    # Get Content-Type from response - because in course service, we have a view that returns a file response.
    content_type = response.headers.get('Content-Type', 'application/json')
    logger.debug(f"Response Content-Type: {content_type}")

    # Handle binary content (e.g., PDF)
    if 'application/pdf' in content_type:
        logger.info("Handling PDF response")
        django_response = HttpResponse(
            content=response.content,
            status=response.status_code,
            content_type=content_type,
        )
        # Preserve Content-Disposition header if present
        if 'Content-Disposition' in response.headers:
            django_response['Content-Disposition'] = response.headers['Content-Disposition']
        return django_response

    # IMP: it would be better to manage it like below in all the proxy views. in this view keep the above if /pdf as well.
    # # Handle JSON content
    # if 'application/json' in content_type:
    #     return Response(
    #         data=response.json(),
    #         status=response.status_code,
    #         content_type=content_type,
    #     )

    # # Fallback for other content types
    # return HttpResponse(
    #     content=response.content,
    #     content_type=content_type,
    #     status=response.status_code
    # )

    logger.debug(f"Course service response: {response.status_code}, Content: {response.json() if 'application/json' in content_type else response.content}")
    return Response(
        data=response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.content,
        status=response.status_code,
        content_type=response.headers.get('Content-Type', 'application/json'),
    )

class BasicCouseCreationGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        url = COURSE_SERVICE_URL + request.path
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        logger.info(f"GET request to BasicCouseCreationGateway: {url}")
        headers = get_forwarded_headers(request)

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            json_data = response.json()
            logger.debug(f"Course service response: {response.status_code}, Content: {json_data}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch course details from {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to fetch course details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
        headers['X-User-Payload'] = user_payload
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"POST request to BasicCouseCreationGateway: {url}, Files: {files.keys()}, Data: {data}")
        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            response.raise_for_status()
            json_data = response.json()
            logger.debug(f"Successful POST response: {response.status_code}, content: {json_data}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update profile at {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def patch(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
        headers['X-User-Payload'] = user_payload
        
        # Determine if it's multipart or JSON data
        files = request.FILES
        if files:  # Multipart data (thumbnail upload)
            data = request.POST
            logger.info(f"PATCH request to BasicCouseCreationGateway (multipart): {url}, Files: {files.keys()}, Data: {data}")
            try:
                response = requests.patch(url, headers=headers, data=data, files=files)
                response.raise_for_status()
                json_data = response.json()
                logger.info(f"Successful PATCH response: {response.status_code}, content: {json_data}")
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to update course at {url}: {str(e)}")
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:  # JSON data (course details)
            data = request.data
            logger.info(f"PATCH request to BasicCouseCreationGateway (JSON): {url}, Data: {data}")
            try:
                response = requests.patch(url, headers=headers, json=data)
                response.raise_for_status()
                json_data = response.json()
                logger.info(f"Successful PATCH response: {response.status_code}")
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to update course at {url}: {str(e)}")
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CourseVideoChunkingGateway(APIView):
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
        headers['X-User-Payload'] = user_payload
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"POST request to CourseVideoChunkingGateway: {url}, Files: {list(files.keys())}, Data: {data}")
        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            logger.info(f"Successful POST response: {response.status_code}")
            response.raise_for_status()
            json_data = response.json()
            return Response(json_data, status=response.status_code)
        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def proxy_to_course_web_hook(request):
    url = COURSE_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"
    logger.info(f"Proxy to course webhook: {url}, Method: {request.method}")
    headers = get_forwarded_headers(request)
    try:
        # Forward raw body without parsing
        response = requests.post(
            url=url,
            headers=headers,
            data=request.body,  # Use raw body other wise signature verification will fail
            timeout=10
        )
        logger.info(f"Webhook response: {response.status_code}, Content: {response.content}")
        return Response(
            data=response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json'),
        )
    except requests.RequestException as e:
        logger.error(f"Webhook proxy error at {url}: {str(e)}")
        return Response({'detail': 'Webhook proxy failed'}, status=500)

class BannersGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        url = COURSE_SERVICE_URL + request.path
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        logger.info(f"GET request to BannersGateway: {url}")
        headers = get_forwarded_headers(request)

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            json_data = response.json()
            logger.debug(f"Banners response: {response.status_code}, Content: {json_data}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch course details from {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to fetch course details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
        headers['X-User-Payload'] = user_payload
        files = request.FILES
        data = request.POST if files else request.data
        logger.info(f"POST request to BannersGateway: {url}, Files: {files.keys()}, Data: {data}")

        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            response.raise_for_status()
            json_data = response.json()
            logger.info(f"Successful POST response: {json_data}, Status: {response.status_code}")
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update at {url}: {str(e)}")
            try:
                error_data = response.json()
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def patch(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
        headers['X-User-Payload'] = user_payload
        
        # Determine if it's multipart or JSON data
        files = request.FILES
        if files:  # Multipart data (thumbnail upload)
            data = request.POST
            logger.info(f"PATCH request to BannersGateway (multipart): {url}, Files: {files.keys()}, Data: {data}")
            try:
                response = requests.patch(url, headers=headers, data=data, files=files)
                response.raise_for_status()
                json_data = response.json()
                logger.info(f"Successful PATCH response: {json_data}, Status: {response.status_code}")
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to update at {url}: {str(e)}")
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:  # JSON data (course details)
            data = request.data
            logger.info(f"PATCH request to BannersGateway (JSON): {url}, Data: {data}")
            try:
                response = requests.patch(url, headers=headers, json=data)
                response.raise_for_status()
                json_data = response.json()
                logger.info(f"Successful PATCH response: {json_data}, Status: {response.status_code}")
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to update at {url}: {str(e)}")
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def proxy_to_chat_service(request):
    url = CHANNEL_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"
    logger.info(f"Proxy to chat service: {request.method} {url}, Files: {request.FILES.keys()}, Data: {request.data}")
    headers = get_forwarded_headers(request)

    if request.method in ['POST', 'PATCH']:
        if request.FILES or 'multipart/form-data' in request.headers.get('Content-Type', ''):
            files = {key: (file.name, file, file.content_type) for key, file in request.FILES.items()}
            data = request.POST  # Pass QueryDict directly instead of dict()
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                data=data,  # Use QueryDict to preserve structure
                files=files,
            )
        else:
            logger.debug("Not multipart data, sending JSON")
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                json=request.data,
            )
    else:
        response = requests.request(
            method=request.method,
            url=url,
            headers=headers,
        )

    if response.status_code == 204:
        logger.info("Received 204 No Content response")
        return Response(status=response.status_code)

    logger.debug(f"Chat service response: {response.status_code}, Content: {response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.content}")
    return Response(
        data=response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.content,
        status=response.status_code,
        content_type=response.headers.get('Content-Type', 'application/json'),
    )

class SimpleAPIView(APIView):
    def get(self, request):
        logger.info("GET request to SimpleAPIView")
        return Response({'name': 'john'}, status=status.HTTP_200_OK)
