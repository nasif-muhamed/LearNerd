import requests
import os

from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.shortcuts import HttpResponse

from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .utils import get_forwarded_headers

# URLs of the other services
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
#'http://host.docker.internal:8001/' # 'http://localhost:8001/'  
ADMIN_SERVICE_URL = os.getenv('ADMIN_SERVICE_URL')
# 'http://host.docker.internal:8002/' # 'http://localhost:8002/'
COURSE_SERVICE_URL = os.getenv('COURSE_SERVICE_URL') # 'http://localhost:8002/'


class UserProfileGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Forward multipart data

    def get(self, request):
        url = USER_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")  # Forward JWT
        }
        try:
            response = requests.get(url, headers=headers)
            print('response: ', response)
            print('response.content: ', response.content)

            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json() 
            print('debug::', request.build_absolute_uri('/'), request.build_absolute_uri(''), json_data['image'])
            if json_data.get('image'):
                json_data['image'] = request.build_absolute_uri('/')[:-1] + json_data['image']
            print('debug2:', json_data['image'])
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request):
        url = USER_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        # Forward files and data
        files = request.FILES
        print("files:", request.FILES)
        data = request.POST if files else request.data

        try:
            response = requests.patch(url, headers=headers, data=data, files=files)
            print('response: ', response)
            print('response.content: ', response.content)
            response.raise_for_status()  # Raise exception for 4xx/5xx

            return Response({'message': 'user updated successfully'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()  # Try to parse error details
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

    print('url: ', url) 
    print("Received Data:", request.data)
    print("files:", request.FILES)

    response = requests.request(
        method=request.method,
        url=url,
        headers=request.headers,
        json=request.data,
    )

    print('response: ', response)
    # print('response.content: ', response.content)
    
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers['Content-Type']
    )

# Proxy view to Product Service
@api_view(['GET', 'POST', 'PATCH'])
def proxy_to_admin_service(request):
    url = ADMIN_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()  # Get query parameters as a URL-encoded string
    if query_params:
        url = f"{url}?{query_params}"  # Append the query parameters to the URL

    print('url: ', url) 

    response = requests.request(
        method=request.method,
        url=url,
        headers=request.headers,
        json=request.data,
    )
    
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

    print('url: ', url)
    print("files api router:", request.FILES)
    print("data api router:", request.POST)

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

    print("Response from admin service:", response.text)
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers.get('Content-Type', 'application/json'),
    )


class BadgeGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Forward multipart data

    def get(self, request):
        url = ADMIN_SERVICE_URL + request.path
        
        query_params = request.GET.urlencode()  # Get query parameters as a URL-encoded string
        if query_params:
            url = f"{url}?{query_params}"  # Append the query parameters to the URL
        print('url, get:', url)

        headers = {
            "Authorization": request.headers.get("Authorization")  # Forward JWT
        }
        try:
            response = requests.get(url, headers=headers)
            print('response: ', response)
            print('response.content: ', response.content)

            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json() 
            print('json_data:', json_data)
            # if json_data.get('image'):
            #     json_data['image'] = request.build_absolute_uri('/')[:-1] + json_data['image']
            # print('debug2:', json_data['image'])
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        url = ADMIN_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        # Forward files and data
        files = request.FILES
        data = request.POST if files else request.data
        print("files:", files)
        print("data:", data)

        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            print('response: ', response)
            # print('response.content: ', response.content)
            response.raise_for_status()  # Raise exception for 4xx/5xx

            return Response({'message': 'user updated successfully'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()  # Try to parse error details
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SingleBadgeGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Forward multipart data

    def get(self, request, id):
        url = ADMIN_SERVICE_URL + request.path
        
        query_params = request.GET.urlencode()  # Get query parameters as a URL-encoded string
        if query_params:
            url = f"{url}?{query_params}"  # Append the query parameters to the URL
        print('url, get:', url)

        headers = {
            "Authorization": request.headers.get("Authorization")  # Forward JWT
        }
        try:
            response = requests.get(url, headers=headers)
            print('response: ', response)
            print('response.content: ', response.content)

            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json() 
            print('json_data:', json_data)
            # if json_data.get('image'):
            #     json_data['image'] = request.build_absolute_uri('/')[:-1] + json_data['image']
            # print('debug2:', json_data['image'])
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, id):
        url = ADMIN_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        # Forward files and data
        files = request.FILES
        data = request.POST if files else request.data
        print("files: ddd", files)
        print("data:", data)

        try:
            response = requests.patch(url, headers=headers, data=data, files=files)
            print('response: ', response)
            # print('response.content: ', response.content)
            response.raise_for_status()  # Raise exception for 4xx/5xx

            return Response({'message': 'user updated successfully'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()  # Try to parse error details
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # Proxy view to Order Service
# @api_view(['GET', 'POST', 'PUT', 'DELETE'])
# def proxy_to_order_service(request):
#     url = ORDER_SERVICE_URL + request.path

#     response = requests.request(
#         method=request.method,
#         url=url,
#         headers=request.headers,
#         json=request.data,
#     )
    
#     return HttpResponse(
#         response.content,
#         status=response.status_code,
#         content_type=response.headers['Content-Type']
#     )

class SimpleAPIView(APIView):
    def get(self, request):
        return Response({'name': 'john'}, status=status.HTTP_200_OK)


class MediaProxyView(APIView):
    SERVICE_MAP = {
        'user': USER_SERVICE_URL,
        'admin': ADMIN_SERVICE_URL,
        # Add other services as needed
    }

    def get(self, request, path):
        # Split path to extract service prefix (e.g., 'user/profile/images/...')
        parts = path.split('/', 1)  # ['user', 'profile/images/...']
        if len(parts) < 2:
            return Response({"error": "Invalid media path"}, status=status.HTTP_400_BAD_REQUEST)

        service_prefix = parts[0]
        base_url = self.SERVICE_MAP.get(service_prefix)

        if not base_url:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

        media_url = f"{base_url}media/{path}"
        print('media_url:', media_url)
        headers = {"Authorization": request.headers.get("Authorization")}
        try:
            response = requests.get(media_url, headers=headers, stream=True)
            response.raise_for_status()
            return HttpResponse(response.content, content_type=response.headers['Content-Type'])
        except requests.exceptions.RequestException as e:
            return Response({"error": "Media not found"}, status=status.HTTP_404_NOT_FOUND)
        

@api_view(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])
def proxy_to_course_service(request):
    print('proxy_to_course_service')
    url = COURSE_SERVICE_URL[:-1] + request.path
    query_params = request.GET.urlencode()
    if query_params:
        url = f"{url}?{query_params}"

    print('url:', url)
    print('query_params:', query_params)
    print("files api router:", request.FILES)
    print("data post api router:", request.POST)
    print("data api router:", request.data)

    # headers = {key: value for key, value in request.headers.items() if key.lower() not in ['host', 'content-length', 'content-type']}
    # headers['Content-Type'] = request.headers.get('Content-Type')  # Preserve original Content-Type
    headers = get_forwarded_headers(request)
    print('Meta proxy 12:', headers)

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
            print('not multipart')
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
        return Response(status=response.status_code)

    print("Response from admin service:", response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.content)
    print(response)
    return Response(
        data=response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.content,
        status=response.status_code,
        content_type=response.headers.get('Content-Type', 'application/json'),
    )

class BasicCouseCreationGateway(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Forward multipart data

    def get(self, request):
        url = COURSE_SERVICE_URL + request.path  # Construct the external service URL
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        print('gateway courses request get:')
        print('url:', url)
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        try:
            # Make a GET request to the external service
            response = requests.get(url, headers=headers)
            print('response: ', response)
            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json()
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()  # Try to parse error details
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to fetch course details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        print('request post:')
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        # Forward files and data
        files = request.FILES
        data = request.POST if files else request.data
        print("files:", files)
        print("data:", data)

        try:
            response = requests.post(url, headers=headers, data=data, files=files)
            print('response: ', response)
            # print('response.content: ', response.content)
            response.raise_for_status()  # Raise exception for 4xx/5xx
            json_data = response.json()
            return Response(json_data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            try:
                error_data = response.json()  # Try to parse error details
                return Response(error_data, status=response.status_code)
            except (ValueError, AttributeError):
                return Response({"error": "Failed to update profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def patch(self, request):
        url = COURSE_SERVICE_URL + request.path
        headers = {
            "Authorization": request.headers.get("Authorization")
        }
        
        # Determine if it's multipart or JSON data
        files = request.FILES
        if files:  # Multipart data (thumbnail upload)
            data = request.POST
            print("patch files:", files)
            print("patch data:", data)
            try:
                response = requests.patch(url, headers=headers, data=data, files=files)
                response.raise_for_status()
                json_data = response.json()
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:  # JSON data (course details)
            data = request.data
            print("patch json data:", data)
            try:
                response = requests.patch(url, headers=headers, json=data)
                response.raise_for_status()
                json_data = response.json()
                return Response(json_data, status=response.status_code)
            except requests.exceptions.RequestException as e:
                try:
                    error_data = response.json()
                    return Response(error_data, status=response.status_code)
                except (ValueError, AttributeError):
                    return Response({"error": "Failed to update course"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
