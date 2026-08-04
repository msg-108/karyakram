"""
Shared DRF permission classes — single source of truth.

Every app (users, events, bookings, dashboard) imports from here instead of
defining its own copy. Previously these were triplicated across
dashboard/permissions.py, events/permissions.py, and bookings/permissions.py
with subtle differences (e.g. dashboard's IsPlainUser didn't check is_staff).
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsOrganizer(BasePermission):
    """User has an OrganizerProfile (approved or not)."""

    message = "This action is only available to organizer accounts."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "organizer_profile")
        )


class IsApprovedOrganizer(IsOrganizer):
    """User has an OrganizerProfile AND has been admin-approved."""

    message = "Your organizer account has not been approved."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.is_approved


class IsPlainUser(BasePermission):
    """
    A regular attendee account — not an organizer and not staff/admin.
    Used for booking endpoints and user dashboard views.
    """

    message = "This action is only available to regular users, not organizer or administrator accounts."

    def has_permission(self, request, view):
        return (
            bool(request.user)
            and request.user.is_authenticated
            and not hasattr(request.user, "organizer_profile")
            and not request.user.is_staff
        )


class IsBookingOwner(BasePermission):
    """Object-level: the requesting user owns the Booking instance."""

    message = "You do not have permission to access this booking."

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class IsEventOwner(BasePermission):
    """Object-level: the requesting user's organizer profile owns the Event."""

    message = "You do not own this event."

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, "organizer_profile"):
            return False
        return obj.organizer_id == request.user.organizer_profile.id


class CanApproveEvent(BasePermission):
    """
    Admin-only gate for the approve/reject/publish actions. Deliberately
    separate from DRF's IsAdminUser so that if event-approval is ever delegated
    to a non-superuser reviewer role, only this class needs to change.
    """

    message = "You do not have permission to review events."

    def has_permission(self, request, view):
        return bool(request.user) and request.user.is_authenticated and request.user.is_staff

