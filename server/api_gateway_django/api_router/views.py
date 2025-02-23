import requests
import os
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# URLs of the other services
USER_SERVICE_URL = 'http://localhost:8001/'  #  os.getenv('ORDER_SERVICE_URL')
ADMIN_SERVICE_URL = 'http://localhost:8002/'  #  os.getenv('USER_SERVICE_URL')
# PRODUCT_SERVICE_URL = 'http://localhost:8002/'  #  os.getenv('PRODUCT_SERVICE_URL')

# Proxy view to User Service
@api_view(['GET', 'POST', 'PATCH'])
def proxy_to_user_service(request):
    url = USER_SERVICE_URL + request.path
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
    print('response.content: ', response.content)
    
    return HttpResponse(
        response.content,
        status=response.status_code,
        content_type=response.headers['Content-Type']
    )

# Proxy view to Product Service
@api_view(['GET', 'POST', 'PATCH'])
def proxy_to_admin_service(request):
    url = ADMIN_SERVICE_URL + request.path

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
