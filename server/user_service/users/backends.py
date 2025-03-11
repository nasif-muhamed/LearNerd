from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework import exceptions
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.hashers import check_password


class CustomModelBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        User = get_user_model()

        # Try to fetch the user by username (or email if that's your USERNAME_FIELD)
        try:
            user = User.objects.get(email=email)  # Adjust if using email instead
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed(
                _("No active account found with the given credentials"),
                code="authentication_failed"
            )

        # Check the password
        if not check_password(password, user.password):
            raise exceptions.AuthenticationFailed(
                _("No active account found with the given credentials"),
                code="authentication_failed"
            )

        # Check if the user is active
        if not user.is_active:
            raise exceptions.AuthenticationFailed(
                _("User blocked"), code="user_blocked"
            )

        return user