"""
not needed anymore, we can delete this file later. Because we are exposing this port for websockets, without using api_gateway,
thought it was useful for the validation of the token in http requests, but we are validating it from the api_gateway
itself. The HTTP requests are being send to api_gateway first, and routed to the channel_service.
"""

# from rest_framework_simplejwt.tokens import AccessToken
# from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
# from django.http import JsonResponse

# class TokenValidationMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         auth_header = request.headers.get('Authorization', '')
#         print('inside __call__:', auth_header)
#         if not auth_header.startswith('Bearer '):
#             request.user_payload = None
#             return self.get_response(request)
        
#         token = auth_header.split(' ')[1]
#         try:
#             # Validate and decode token
#             access_token = AccessToken(token)
            
#             payload = {
#                 'user_id': access_token.get('user_id'),
#                 'is_profile_completed': access_token.get('is_profile_completed'),
#                 'is_tutor': access_token.get('is_tutor'),
#                 'is_admin': access_token.get('is_admin'),
#             }
#             print(f'User Payload: {payload}')
#             request.user_payload = payload
            
#         except InvalidToken as e:
#             error_response = {
#                 "detail": str(e),
#                 "code": "token_not_valid",
#                 "messages": [
#                     {
#                         "token_class": "AccessToken",
#                         "token_type": "access",
#                         "message": "Token is invalid"
#                     }
#                 ]
#             }
#             return JsonResponse(error_response, status=401)
        
#         except TokenError as e:
#             error_response = {
#                 "detail": str(e),
#                 "code": "token_not_valid",
#                 "messages": [
#                     {
#                         "token_class": "AccessToken",
#                         "token_type": "access",
#                         "message": "Token is expired"
#                     }
#                 ]
#             }
#             return JsonResponse(error_response, status=401)
        
#         return self.get_response(request)