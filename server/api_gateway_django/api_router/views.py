import requests
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from django.shortcuts import HttpResponse
import os

# URLs of the other services
USER_SERVICE_URL = 'http://localhost:8001/'  #  os.getenv('ORDER_SERVICE_URL')
ADMIN_SERVICE_URL = 'http://localhost:8002/'  #  os.getenv('USER_SERVICE_URL')
# PRODUCT_SERVICE_URL = 'http://localhost:8002/'  #  os.getenv('PRODUCT_SERVICE_URL')

# Proxy view to User Service
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def proxy_to_user_service(request):
    url = USER_SERVICE_URL + request.path
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

# Proxy view to Product Service
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def proxy_to_product_service(request):
    url = PRODUCT_SERVICE_URL + request.path

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

# Proxy view to Order Service
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def proxy_to_order_service(request):
    url = ORDER_SERVICE_URL + request.path

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

def hello_world(request):
    return HttpResponse('Hello World')