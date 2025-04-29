from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import HomeBanner, AdBanner, AdVideo
from .serializers import HomeBannerSerializer, AdBannerSerializer, AdVideoSerializer, ActiveContentSerializer

# List and create new video ads
class HomeBannerListCreateView(generics.ListCreateAPIView):
    queryset = HomeBanner.objects.all()
    serializer_class = HomeBannerSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        # Deactivate all currently active Home-Banners
        HomeBanner.objects.filter(active=True).update(active=False)
        serializer.save()


# Retrieve, update, or delete a specific video ad
class HomeBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HomeBanner.objects.all()
    serializer_class = HomeBannerSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

# List and create new video ads
class AdBannerListCreateView(generics.ListCreateAPIView):
    queryset = AdBanner.objects.all()
    serializer_class = AdBannerSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        # Deactivate all currently active Ad-Banners
        AdBanner.objects.filter(active=True).update(active=False)
        serializer.save()

# Retrieve, update, or delete a specific video ad
class AdBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AdBanner.objects.all()
    serializer_class = AdBannerSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

# List and create new video ads
class AdVideoListCreateView(generics.ListCreateAPIView):
    queryset = AdVideo.objects.all()
    serializer_class = AdVideoSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        # Deactivate all currently active Ad-Videos
        AdVideo.objects.filter(active=True).update(active=False)
        serializer.save()

# Retrieve, update, or delete a specific video ad
class AdVideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AdVideo.objects.all()
    serializer_class = AdVideoSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

class ActiveContentView(APIView):
    def get(self, request, *args, **kwargs):
        # Fetch the first active object for each model
        home_banner = HomeBanner.objects.filter(active=True).first()
        study_room_banner = AdBanner.objects.filter(active=True).first()
        pre_rollVideo = AdVideo.objects.filter(active=True).first()

        data = {
            'home_banner': home_banner,
            'study_room_banner': study_room_banner,
            'pre_rollVideo': pre_rollVideo
        }

        serializer = ActiveContentSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)