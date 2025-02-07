from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'biography', 'image', 'is_tutor', 'is_active']
        read_only_fields = ['id', 'is_tutor', 'is_active']

    password = serializers.CharField(write_only=True)

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

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['is_active']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token payload
        token['is_active'] = user.is_active
        token['is_tutor'] = user.is_tutor  

        return token
