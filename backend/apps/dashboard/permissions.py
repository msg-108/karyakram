"""Custom DRF permissions. Admin checks use is_staff/is_superuser directly
(no separate admin role — see requirement #3), so IsAdminUser from DRF core
already covers most of that; the classes below only add role-specific
checks DRF doesn't ship."""
from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsOrganizer(BasePermission):
    message = "This action is only available to organizer accounts."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return hasattr(request.user, "organizer_profile")


class IsApprovedOrganizer(IsOrganizer):
    message = "Your organizer account has not been approved."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        return request.user.is_approved

class IsPlainUser(BasePermission):
    message = "This action is only available to regular users."

    def has_permission(self, request, view):
        return (
            bool(request.user)
            and request.user.is_authenticated
            and not hasattr(request.user, "organizer_profile")
        )