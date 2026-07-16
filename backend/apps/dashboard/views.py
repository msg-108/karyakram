from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema, PolymorphicProxySerializer
from apps.users.models import User, Organizer
from .serializers import (
    UserDashboardSerializer,
    OrganizerDashboardSerializer,
    AdminDashboardSerializer,
)


class DashboardView(APIView):
    """
    API endpoint for getting user dashboard data based on their type.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=PolymorphicProxySerializer(
            component_name="DashboardResponse",
            serializers=[
                UserDashboardSerializer,
                OrganizerDashboardSerializer,
                AdminDashboardSerializer,
            ],
            resource_type_field_name="role",
        ),
        description="Get dashboard data for the authenticated user",
        tags=["Dashboard"],
    )
    def get(self, request):
        """Get dashboard data based on user type."""
        # Check if admin
        if request.user.is_staff and request.user.is_superuser:
            serializer = AdminDashboardSerializer(request.user)
            return Response(serializer.data)
        
        # Check if organizer
        if isinstance(request.user, Organizer):
            serializer = OrganizerDashboardSerializer(request.user)
            return Response(serializer.data)
        
        # Check if standard user
        if isinstance(request.user, User):
            serializer = UserDashboardSerializer(request.user)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Invalid user type."},
            status=status.HTTP_403_FORBIDDEN
        )
