from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Badges
from .serializers import BadgeSerializer, SimplifiedBadgeSerializer

class BadgeView(APIView):
    def get(self, request, id=None):
        # If id is provided, return a single badge with questions and answers
        if id:
            try:
                badge = Badges.objects.get(id=id)
                serializer = BadgeSerializer(badge)
                return Response(serializer.data)
            except Badges.DoesNotExist:
                return Response({'detail': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # If no id is provided, return the list of badges.
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
