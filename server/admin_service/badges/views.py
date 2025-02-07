from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Badges
from .serializers import BadgeSerializer, SimplifiedBadgeSerializer

class BadgesView(APIView):
    def get(self, request):        
        # Return the list of badges without questions and answers
        badges = Badges.objects.all()
        serializer = SimplifiedBadgeSerializer(badges, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Create a new badge with related questions and answers
        serializer = BadgeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BadgeView(APIView):
    def get(self, request, id):
        try:
            badge = Badges.objects.get(id=id)
            serializer = BadgeSerializer(badge)
            return Response(serializer.data)
        except Badges.DoesNotExist:
            return Response({'detail': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
