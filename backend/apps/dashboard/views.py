from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import (
    UserDashboardSerializer,
    OrganizerDashboardSerializer,
    AdminDashboardSerializer,
)

DASHBOARD_SERIALIZERS = {
    "user": UserDashboardSerializer,
    "organizer": OrganizerDashboardSerializer,
    "admin": AdminDashboardSerializer,
}


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.user.role
        serializer_class = DASHBOARD_SERIALIZERS.get(role)

        if not serializer_class:
            return Response(
                {"detail": "Invalid role."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = serializer_class(request.user)
        return Response(serializer.data)


