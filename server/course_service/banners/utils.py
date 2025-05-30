from .models import AdBanner, AdVideo, HomeBanner
from .serializers import ActiveContentSerializer

def get_ad_content():
    study_room_banner = AdBanner.objects.filter(active=True).first()
    pre_rollVideo = AdVideo.objects.filter(active=True).first()

    data = {
        'study_room_banner': study_room_banner,
        'pre_rollVideo': pre_rollVideo
    }

    return ActiveContentSerializer(data).data

def get_home_banner():
    home_banner = HomeBanner.objects.filter(active=True).first()
    data = {
        'home_banner': home_banner,
    }

    return ActiveContentSerializer(data).data
