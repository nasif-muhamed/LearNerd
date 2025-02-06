from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from . models import AdminUser
from . serializers import AdminUserSerializer


class AdminView(APIView):
    permission_class = [IsAdminUser]
    
    def get(self, request, pk):
        try:
            user = AdminUser.objects.get(pk=pk)
            serializer = AdminUserSerializer(user)
            return Response(serializer.data)
        
        except AdminUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

