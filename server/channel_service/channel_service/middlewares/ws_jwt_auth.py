# middleware/jwt_auth.py
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.middleware import BaseMiddleware
# from channels.db import database_sync_to_async
# from django.contrib.auth.models import AnonymousUser
# from django.contrib.auth import get_user_model


# class JWTAuthMiddleware(BaseMiddleware):
#     async def __call__(self, scope, receive, send):
#         # Extract token from query string
#         print('here in JWTAuthMiddleware')
#         query_string = scope.get('query_string', b'').decode()
#         token = None
#         for param in query_string.split('&'):
#             if param.startswith('token='):
#                 token = param.split('=')[1]
#                 break
#         print('Token:', token)
#         if token:
#             try:
#                 # Validate and decode token
#                 access_token = AccessToken(token)
#                 payload = {
#                     'user_id': access_token.get('user_id'),
#                     'is_profile_completed': access_token.get('is_profile_completed'),
#                     'is_tutor': access_token.get('is_tutor'),
#                     'is_admin': access_token.get('is_admin'),
#                 }
#                 print(f'User Payload: {payload}')
#                 scope['user_payload'] = payload
#                 # scope['user'] = await self.get_user(payload['user_id'])
#             except (InvalidToken, TokenError) as e:
#                 print('invalid token')
#                 scope['user_payload'] = None
#                 # scope['user'] = AnonymousUser()
#         else:
#             scope['user_payload'] = None
#             # scope['user'] = AnonymousUser()

#         return await super().__call__(scope, receive, send)

    # @database_sync_to_async
    # def get_user(self, user_id):
    #     User = get_user_model()
    #     try:
    #         return User.objects.get(id=user_id)
    #     except User.DoesNotExist:
    #         return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        if token:
            try:
                access_token = AccessToken(token)
                payload = {
                    'user_id': access_token.get('user_id'),
                    'is_profile_completed': access_token.get('is_profile_completed'),
                    'is_tutor': access_token.get('is_tutor'),
                    'is_admin': access_token.get('is_admin'),
                }
                scope['user_payload'] = payload
                # scope['user'] = await self.get_user(payload['user_id'])
            except InvalidToken as e:
                scope['user_payload'] = None
                # scope['user'] = AnonymousUser()
                # Send close message with code and reason
                await send({
                    'type': 'websocket.close',
                    'code': 4001,
                    'reason': 'token_not_valid'
                })
                return
            except TokenError as e:
                scope['user_payload'] = None
                # scope['user'] = AnonymousUser()
                await send({
                    'type': 'websocket.close',
                    'code': 4001,
                    'reason': 'token_not_valid'
                })
                return
        else:
            scope['user_payload'] = None
            # scope['user'] = AnonymousUser()
            await send({
                'type': 'websocket.close',
                'code': 4001,
                'reason': 'token_missing'
            })
            return

        return await super().__call__(scope, receive, send)