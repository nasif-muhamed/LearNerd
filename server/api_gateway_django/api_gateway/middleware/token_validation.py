from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import JsonResponse

class TokenValidationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # # Skip validation for public endpoints if any
        # public_endpoints = ['/health/', '/docs/']  # Add your public endpoints
        # if request.path in public_endpoints:
        #     return self.get_response(request)
        print('Custom Validation Middleware')
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            # request.user_payload = None
            request.META['HTTP_X_USER_PAYLOAD'] = str(None)
            return self.get_response(request)
        
        token = auth_header.split(' ')[1]
        print(f'Token: {token}')
        try:
            # Validate and decode token
            access_token = AccessToken(token)
            # Extract payload
            print('Access Token Payload:', access_token.payload)
            payload = {
                'user_id': access_token.get('user_id'),
                'is_profile_completed': access_token.get('is_profile_completed'),
                'is_tutor': access_token.get('is_tutor'),
                'is_admin': access_token.get('is_admin'),
            }
            print(f'Payload: {payload}')
            
            # Attach payload to the headers. So the downstream services can use it.
            request.META['HTTP_X_USER_PAYLOAD'] = str(payload)
            print(f'HTTP_X_USER_PAYLOAD: {request.META["HTTP_X_USER_PAYLOAD"]}')
            print('headers:', request.headers)
            print('get header:', request.headers.get('HTTP_X_USER_PAYLOAD'))
        except InvalidToken as e:
            error_response = {
                "detail": str(e),
                "code": "token_not_valid",
                "messages": [
                    {
                        "token_class": "AccessToken",
                        "token_type": "access",
                        "message": "Token is invalid"
                    }
                ]
            }
            return JsonResponse(error_response, status=401)
        
        except TokenError as e:
            error_response = {
                "detail": str(e),
                "code": "token_not_valid",
                "messages": [
                    {
                        "token_class": "AccessToken",
                        "token_type": "access",
                        "message": "Token is expired"
                    }
                ]
            }
            return JsonResponse(error_response, status=401)
        
        return self.get_response(request)