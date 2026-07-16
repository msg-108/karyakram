from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, inline_serializer
from .models import User, Organizer
from .serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    OrganizerRegisterSerializer,
    OrganizerProfileSerializer,
)


# ==================== USER VIEWS ====================

class UserRegisterView(APIView):
    """
    API endpoint for user registration.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=UserRegisterSerializer,
        responses=UserProfileSerializer,
        description="Register a new standard user account",
        tags=["User Authentication"],
    )
    def post(self, request):
        """Register a new user."""
        serializer = UserRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


class UserProfileView(APIView):
    """
    API endpoint for user profile management.
    """
    permission_classes = [IsAuthenticated]

    def get_user_or_404(self, request):
        """Helper to get authenticated user if they are a User (not Organizer)."""
        if isinstance(request.user, User):
            return request.user
        return None

    @extend_schema(
        responses=UserProfileSerializer,
        description="Get the authenticated user's profile",
        tags=["User Profile"],
    )
    def get(self, request):
        """Get user profile."""
        user = self.get_user_or_404(request)
        if not user:
            return Response(
                {"detail": "Only standard users can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    @extend_schema(
        request=UserProfileSerializer,
        responses=UserProfileSerializer,
        description="Update the authenticated user's profile",
        tags=["User Profile"],
    )
    def patch(self, request):
        """Update user profile."""
        user = self.get_user_or_404(request)
        if not user:
            return Response(
                {"detail": "Only standard users can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


# ==================== ORGANIZER VIEWS ====================

class OrganizerRegisterView(APIView):
    """
    API endpoint for organizer registration.
    Requires email, phone, and detailed business information.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=OrganizerRegisterSerializer,
        responses=OrganizerProfileSerializer,
        description="Register a new organizer account",
        tags=["Organizer Authentication"],
    )
    def post(self, request):
        """Register a new organizer."""
        serializer = OrganizerRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        organizer = serializer.save()
        return Response(OrganizerProfileSerializer(organizer).data, status=status.HTTP_201_CREATED)


class OrganizerProfileView(APIView):
    """
    API endpoint for organizer profile management.
    """
    permission_classes = [IsAuthenticated]

    def get_organizer_or_404(self, request):
        """Helper to get authenticated organizer if they are an Organizer (not User)."""
        if isinstance(request.user, Organizer):
            return request.user
        return None

    @extend_schema(
        responses=OrganizerProfileSerializer,
        description="Get the authenticated organizer's profile",
        tags=["Organizer Profile"],
    )
    def get(self, request):
        """Get organizer profile."""
        organizer = self.get_organizer_or_404(request)
        if not organizer:
            return Response(
                {"detail": "Only organizers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = OrganizerProfileSerializer(organizer)
        return Response(serializer.data)

    @extend_schema(
        request=OrganizerProfileSerializer,
        responses=OrganizerProfileSerializer,
        description="Update the authenticated organizer's profile",
        tags=["Organizer Profile"],
    )
    def patch(self, request):
        """Update organizer profile."""
        organizer = self.get_organizer_or_404(request)
        if not organizer:
            return Response(
                {"detail": "Only organizers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = OrganizerProfileSerializer(organizer, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


# ==================== LOGOUT VIEW ====================

class LogoutView(APIView):
    """
    API endpoint for user logout (works for both User and Organizer).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer(name="LogoutRequest", fields={"refresh": serializers.CharField()}),
        responses=inline_serializer(name="LogoutResponse", fields={"detail": serializers.CharField()}),
        description="Logout the authenticated user",
        tags=["Authentication"],
    )
    def post(self, request):
        """Logout user by blacklisting their refresh token."""
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )
