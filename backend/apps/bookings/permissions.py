"""
Custom DRF permissions.

IsPlainUser duplicates (rather than imports) apps.dashboard.permissions'
class of the same name, and IsOrganizer/IsApprovedOrganizer duplicate
apps.events.permissions' — same rationale apps.events.permissions already
states for its own duplication: importing across apps for a two-line
permission check would make bookings depend on dashboard/events for
something that isn't really shared logic, just a check that happens to
look the same today.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsPlainUser(BasePermission):
    """
    A booking is made by someone attending an event, not by the organizer
    running it — organizer accounts have their own workflow (managing
    their own events' tiers) and are never the intended caller of
    POST /bookings/. Checked the same way apps.dashboard.permissions does:
    the absence of `organizer_profile`, since that's the actual
    distinguishing signal on User today (see apps.users.models.User —
    role is a field, but `organizer_profile` only exists as a reverse
    OneToOne when an OrganizerProfile row was actually created for this
    user).
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
    """
    Object-level check: the requesting user owns the Booking instance.
    Same shape as apps.events.permissions.IsEventOwner — always pair with
    IsAuthenticated (and typically IsPlainUser) at the has_permission
    level, since this class only implements has_object_permission.
    """

    message = "You do not have permission to access this booking."

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id