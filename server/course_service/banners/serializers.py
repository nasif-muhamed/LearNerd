from rest_framework import serializers
from .models import HomeBanner, AdBanner, AdVideo

class HomeBannerSerializer(serializers.ModelSerializer):
    banner_url = serializers.SerializerMethodField()
    class Meta:
        model = HomeBanner
        fields = ['banner', 'title', 'description', 'active', 'created_at', 'updated_at', 'banner_url']
        read_only_fields = ('active',)
        extra_kwargs = {
            'banner': {'write_only': True}
        }

    def get_banner_url(self, obj):
        if obj.banner:
            return obj.banner.url
        return None

class AdBannerSerializer(serializers.ModelSerializer):
    banner_url = serializers.SerializerMethodField()
    class Meta:
        model = AdBanner
        fields = ['banner', 'title', 'active', 'created_at', 'updated_at', 'banner_url']
        read_only_fields = ('active',)
        extra_kwargs = {
            'banner': {'write_only': True}
        }

    def get_banner_url(self, obj):
        if obj.banner:
            return obj.banner.url
        return None

class AdVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    class Meta:
        model = AdVideo
        fields = ['video', 'title', 'active', 'created_at', 'updated_at', 'video_url']
        read_only_fields = ('active',)
        extra_kwargs = {
            'video': {'write_only': True}
        }

    def get_video_url(self, obj):
        if obj.video:
            return obj.video.url
        return None

class ActiveContentSerializer(serializers.Serializer):
    home_banner = HomeBannerSerializer(allow_null=True)
    study_room_banner = AdBannerSerializer(allow_null=True)
    pre_rollVideo = AdVideoSerializer(allow_null=True)