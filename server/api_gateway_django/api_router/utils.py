def get_forwarded_headers(request):
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in ['host', 'content-length', 'content-type']
    }

    headers['Content-Type'] = request.headers.get('Content-Type', 'application/json')

    user_payload = request.META.get('HTTP_X_USER_PAYLOAD')
    headers['X-User-Payload'] = user_payload

    return headers
