from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Event
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    AdminEventApprovalSerializer,
)


class IsOrganizerOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer_id == request.user.id


class IsOrganizerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'organizer'
        )


class EventListView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsOrganizerRole()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventDetailSerializer
        return EventListSerializer

    def get_queryset(self):
        if self.request.method == 'POST':
            return Event.objects.all()
        return Event.objects.filter(status='published', approval_status='approved')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventDetailSerializer
    lookup_field = 'slug'
    queryset = Event.objects.all()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOrganizerOwner()]


class MyEventsView(generics.ListAPIView):
    serializer_class = EventListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)


class AdminEventApprovalView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, slug):
        event = get_object_or_404(Event, slug=slug)
        serializer = AdminEventApprovalSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)