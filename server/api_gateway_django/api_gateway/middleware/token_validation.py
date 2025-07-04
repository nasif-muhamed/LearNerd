from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import JsonResponse

class TokenValidationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            request.META['HTTP_X_USER_PAYLOAD'] = str(None)
            return self.get_response(request)
        
        token = auth_header.split(' ')[1]
        try:
            # Validate and decode token
            access_token = AccessToken(token)
            payload = {
                'user_id': access_token.get('user_id'),
                'is_profile_completed': access_token.get('is_profile_completed'),
                'is_tutor': access_token.get('is_tutor'),
                'is_admin': access_token.get('is_admin'),
            }
            # Attach payload to the headers. So the downstream services can use it.
            request.META['HTTP_X_USER_PAYLOAD'] = str(payload)
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