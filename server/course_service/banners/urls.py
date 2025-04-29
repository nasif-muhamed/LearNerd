from django.urls import path
# from rest_framework.routers import DefaultRouter
from .views import (HomeBannerDetailView, HomeBannerListCreateView, AdBannerListCreateView, AdBannerDetailView, AdVideoListCreateView, AdVideoDetailView, ActiveContentView)

urlpatterns = [
    path('home-banner/', HomeBannerListCreateView.as_view(), name='home-banner-list-create'),
    path('home-banner/<int:pk>/', HomeBannerDetailView.as_view(), name='home-banner-detail'),

    path('ad-banner/', AdBannerListCreateView.as_view(), name='ad-banner-list-create'),
    path('ad-banner/<int:pk>/', AdBannerDetailView.as_view(), name='ad-banner-detail'),

    path('ad-videos/', AdVideoListCreateView.as_view(), name='advideo-list-create'),
    path('ad-videos/<int:pk>/', AdVideoDetailView.as_view(), name='advideo-detail'),

    path('active/', ActiveContentView.as_view(), name='active-banners'),
]
