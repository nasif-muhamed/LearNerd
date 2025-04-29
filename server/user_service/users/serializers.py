from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import exceptions

from .models import BadgesAquired, Notification, Wallet

Profile = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['email', 'password']
        extra_kwargs = {'password': {'write_only': True}, 'email': {'write_only': True}}

    def validate_password(self, value):
        # validation for password strength.
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char in "!@#$%^&*()-_=+" for char in value):
            raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*()-_=+).")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Profile(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Check if the user exists
        if not Profile.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is associated with this email.")
        return value

class ForgotPasswordOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class ForgotPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        value = data['password']
        # validation for password strength.
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char in "!@#$%^&*()-_=+" for char in value):
            raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*()-_=+).")
        return data
    
class ProfileSerializer(serializers.ModelSerializer):
    # badges_aquired = BadgesAquiredSerializer(many=True, read_only=True)
    unread_notifications = serializers.IntegerField(read_only=True)
    class Meta:
        model = Profile
        fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'is_active', 'created_at', 'unread_notifications']  # 'badges_aquired'
        read_only_fields = ['id', 'email', 'is_tutor', 'is_active', 'created_at'] # 'badges_aquired'

class ProfileDetailsSerializer(serializers.ModelSerializer):  # for anyone to see the profile details
    class Meta:
        model = Profile
        fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image']

class UserActionSerializer(serializers.ModelSerializer):
    is_profile_completed = serializers.ReadOnlyField()
    
    class Meta:
        model = Profile
        fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'is_active', 'created_at', 'is_profile_completed']
        read_only_fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'created_at']

    # def get_is_profile_completed(self, obj):
    #     # Check if first_name, last_name, and biography are non-empty and not-None
    #     return bool(obj.first_name and obj.last_name and obj.biography)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token payload
        # token['is_active'] = user.is_active
        token['is_tutor'] = user.is_tutor
        token['is_profile_completed'] = user.is_profile_completed

        return token
    
    def validate(self, attrs):
        # Call the parent validate method to authenticate the user
        data = super().validate(attrs)

        # Check if the user is active
        if not self.user.is_active:
            raise exceptions.AuthenticationFailed(
                _("User is blocked"), code="user_blocked"
            )

        return data
    
class BadgesAquiredSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgesAquired
        fields = [
            'id', 'profile', 'badge_id', 'badge_title', 'badge_image', 
            'total_questions', 'pass_mark', 'aquired_mark', 'attempts', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgesAquired
        fields = [
            'badge_id', 'badge_title', 'badge_image', 
            'total_questions', 'pass_mark', 'aquired_mark', 'attempts', 
            'created_at', 'updated_at'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'message', 'is_read', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'user', 'balance', 'created_at', 'updated_at']
        read_only_fields = fields
