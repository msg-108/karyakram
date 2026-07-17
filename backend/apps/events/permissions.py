"""Custom DRF permissions. Admin checks use is_staff/is_superuser directly
(no separate admin role — see apps.dashboard.permissions), so IsAdminUser
from DRF core already covers most of that; the classes below only add
event-specific checks DRF doesn't ship.

IsOrganizer/IsApprovedOrganizer duplicate (rather than import)
apps.dashboard.permissions' classes of the same name. Importing across
those two apps for a two-line permission check would make events depend
on dashboard, which is backwards — dashboard aggregates data from other
apps, other apps should not depend on dashboard.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrganizer(BasePermission):
    message = "This action is only available to organizer accounts."

    def has_permission(self, request, view):
        return (
            bool(request.user)
            and request.user.is_authenticated
            and hasattr(request.user, "organizer_profile")
        )


class IsApprovedOrganizer(IsOrganizer):
    """
    Stricter than IsOrganizer: the account must also be an admin-approved
    organizer. `is_approved` lives on `User`, not `OrganizerProfile` — see
    apps.users.models.User.is_approved — so it's read off request.user
    directly rather than off request.user.organizer_profile.
    """

    message = "Your organizer account has not yet been approved."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        return request.user.is_approved


class IsEventOwner(BasePermission):
    """
    Object-level check: the requesting organizer owns the Event instance.
    Always pair with IsApprovedOrganizer (or IsOrganizer) at the
    has_permission level — this class only implements has_object_permission,
    so on its own it would let any authenticated request through the
    has_permission stage before being checked here.
    """

    message = "You do not have permission to modify this event."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        organizer_profile = getattr(request.user, "organizer_profile", None)
        return organizer_profile is not None and obj.organizer_id == organizer_profile.id


class CanApproveEvent(BasePermission):
    """
    Admin-only gate for the approve/reject/publish actions. Deliberately
    separate from DRF's IsAdminUser (rather than just using that directly
    in views) so that if event-approval is ever delegated to a
    non-superuser reviewer role in the future, only this one class needs
    to change.
    """

    message = "You do not have permission to review events."

    def has_permission(self, request, view):
        return bool(request.user) and request.user.is_authenticated and request.user.is_staff