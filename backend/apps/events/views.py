from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from apps.users.models import Organizer
from .models import Event
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    AdminEventApprovalSerializer,
)


class IsOrganizerOwner(permissions.BasePermission):
    """Permission to check if user is the organizer of the event."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return isinstance(request.user, Organizer) and obj.organizer_id == request.user.id


class IsOrganizerUser(permissions.BasePermission):
    """Permission to check if user is an Organizer."""
    def has_permission(self, request, view):
        return isinstance(request.user, Organizer) and request.user.is_approved_by_admin


class EventListView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating events.
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsOrganizerUser()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventDetailSerializer
        return EventListSerializer

    def get_queryset(self):
        if self.request.method == 'POST':
            return Event.objects.all()
        return Event.objects.filter(status='published', approval_status='approved')

    @extend_schema(
        description="List all published and approved events",
        tags=["Events"],
    )
    def get(self, request, *args, **kwargs):
        """List all published events."""
        return super().get(request, *args, **kwargs)

    @extend_schema(
        description="Create a new event (approved organizers only)",
        tags=["Events"],
    )
    def post(self, request, *args, **kwargs):
        """Create a new event."""
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting events.
    """
    serializer_class = EventDetailSerializer
    lookup_field = 'slug'
    queryset = Event.objects.all()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOrganizerOwner()]

    @extend_schema(
        description="Retrieve event details by slug",
        tags=["Events"],
    )
    def get(self, request, *args, **kwargs):
        """Get event details."""
        return super().get(request, *args, **kwargs)

    @extend_schema(
        description="Update event details (organizer owner only)",
        tags=["Events"],
    )
    def put(self, request, *args, **kwargs):
        """Update event."""
        return super().put(request, *args, **kwargs)

    @extend_schema(
        description="Partially update event (organizer owner only)",
        tags=["Events"],
    )
    def patch(self, request, *args, **kwargs):
        """Partial update event."""
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        description="Delete event (organizer owner only)",
        tags=["Events"],
    )
    def delete(self, request, *args, **kwargs):
        """Delete event."""
        return super().delete(request, *args, **kwargs)


class MyEventsView(generics.ListAPIView):
    """
    API endpoint for listing organizer's own events.
    """
    serializer_class = EventListSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerUser]

    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)

    @extend_schema(
        description="List all events created by the authenticated organizer",
        tags=["Events"],
    )
    def get(self, request, *args, **kwargs):
        """List organizer's events."""
        return super().get(request, *args, **kwargs)


class AdminEventApprovalView(APIView):
    """
    API endpoint for admin to approve or reject events.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminEventApprovalSerializer

    @extend_schema(
        request=AdminEventApprovalSerializer,
        responses=AdminEventApprovalSerializer,
        description="Approve or reject an event (admin only)",
        tags=["Admin"],
    )
    def patch(self, request, slug):
        """Approve or reject an event."""
        event = get_object_or_404(Event, slug=slug)
        serializer = AdminEventApprovalSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)
