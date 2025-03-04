from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile


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


class ProfileSerializer(serializers.ModelSerializer):    
    class Meta:
        model = Profile
        fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'is_active', 'created_at']
        read_only_fields = ['id', 'email', 'is_tutor', 'is_active', 'created_at']


class UserActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'is_active', 'created_at']
        read_only_fields = ['id', 'email', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token payload
        token['is_active'] = user.is_active
        token['is_tutor'] = user.is_tutor  

        return token
