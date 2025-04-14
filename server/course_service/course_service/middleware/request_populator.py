import ast
import logging

# Configure logging to show messages in the console
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to see all messages
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class RequestPopulatorMiddleware:
    """
    Middleware to populate the request object with user payload from the 
    'X-User-Payload' header sent by the API gateway. The payload is expected 
    to be a valid Python literal (e.g., dict, list, str, int) parseable by 
    ast.literal_eval. If the header is missing or invalid, request.user_payload 
    is set to None.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # print('RequestPopulatorMiddleware')
        # logger.debug("Processing request in RequestPopulatorMiddleware")
        # logger.debug("headears: %s", request.headers)
        
        # Get the user payload from the header (normalized as HTTP_X_USER_PAYLOAD)
        user_payload_str = request.headers.get('X-User-Payload', None)
        # print(f'User Payload Header: {request.headers}')
        # print(f'User Payload: {user_payload_str}')
        if user_payload_str is None:
            # logger.debug("No user payload found in request headers")
            request.user_payload = None
        else:
            try:
                # Safely parse the payload string into a Python object
                user_payload = ast.literal_eval(user_payload_str)
                request.user_payload = user_payload
                # logger.debug(f"User Payload successfully parsed: {request.user_payload}")
            except (ValueError, SyntaxError) as e:
                # Handle invalid payload gracefully
                # logger.warning(f"Failed to parse user payload: {user_payload_str}. Error: {e}")
                request.user_payload = None
        
        # Proceed to the next middleware or view
        return self.get_response(request)
    