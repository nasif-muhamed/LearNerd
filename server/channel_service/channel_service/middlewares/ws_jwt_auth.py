# middleware/jwt_auth.py
import logging
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.middleware import BaseMiddleware

logger = logging.getLogger(__name__)

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
                await send({
                    'type': 'websocket.close',
                    'code': 4001,
                    'reason': 'token_not_valid'
                })
                return
            except TokenError as e:
                scope['user_payload'] = None
                logger.error(f"Token error: {e}")
                await send({
                    'type': 'websocket.close',
                    'code': 4001,
                    'reason': 'token_not_valid'
                })
                return
        else:
            scope['user_payload'] = None
            logger.warning("WebSocket connection attempt without token")
            await send({
                'type': 'websocket.close',
                'code': 4001,
                'reason': 'token_missing'
            })
            return

        return await super().__call__(scope, receive, send)