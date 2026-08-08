"""
Input/output validation only — no business logic. Every serializer here is
a plain Serializer, never a ModelSerializer, because none of the shapes
below have a backing model: they mirror the @dataclass result objects
services.py returns (the same reason OrganizerRegisterSerializer in
`users` is a plain Serializer rather than forcing a Meta.model). Field
names and types are matched 1:1 against their dataclass so a future
find-and-replace of a placeholder service body doesn't also require
changing the serializer.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.serializers import OrganizerProfileSerializer, UserPublicSerializer

# ==================== USER DASHBOARD: PROFILE SUMMARY ====================


class UserProfileSummarySerializer(serializers.Serializer):
    user = UserPublicSerializer(read_only=True)
    upcoming_ticket_count = serializers.IntegerField(read_only=True)
    total_ticket_count = serializers.IntegerField(read_only=True)
    unread_notification_count = serializers.IntegerField(read_only=True)


# ==================== USER DASHBOARD: TICKETS ====================


class TicketSummarySerializer(serializers.Serializer):
    ticket_id = serializers.UUIDField()
    event_title = serializers.CharField()
    event_date_time = serializers.DateTimeField()
    event_location = serializers.CharField()
    seat_or_tier = serializers.CharField()
    status = serializers.CharField()


# ==================== USER DASHBOARD: PAYMENTS ====================


class PaymentSummarySerializer(serializers.Serializer):
    payment_id = serializers.IntegerField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    paid_at = serializers.DateTimeField(read_only=True, allow_null=True)
    event_name = serializers.CharField(read_only=True)


# ==================== USER DASHBOARD: EVENTS & ACTIVITY ====================


class EventSummarySerializer(serializers.Serializer):
    event_id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    date_time = serializers.DateTimeField(read_only=True)
    location = serializers.CharField(read_only=True)
    organizer_name = serializers.CharField(read_only=True)


class ActivityItemSerializer(serializers.Serializer):
    occurred_at = serializers.DateTimeField(read_only=True)
    description = serializers.CharField(read_only=True)


# ==================== NOTIFICATIONS (future-ready, shared shape) ====================


class NotificationSummarySerializer(serializers.Serializer):
    notification_id = serializers.IntegerField(read_only=True)
    message = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)


# ==================== ORGANIZER DASHBOARD: PROFILE SUMMARY ====================


class OrganizerProfileSummarySerializer(serializers.Serializer):
    profile = OrganizerProfileSerializer(read_only=True)
    total_events = serializers.IntegerField(read_only=True)
    upcoming_events = serializers.IntegerField(read_only=True)
    unread_notification_count = serializers.IntegerField(read_only=True)


# ==================== ORGANIZER DASHBOARD: STATISTICS & ANALYTICS ====================


class EventStatisticsSerializer(serializers.Serializer):
    total_events = serializers.IntegerField(read_only=True)
    total_tickets_sold = serializers.IntegerField(read_only=True)
    total_attendees_checked_in = serializers.IntegerField(read_only=True)


class RevenueByMonthSerializer(serializers.Serializer):
    """
    One (label, amount) point in RevenueAnalytics.by_month. A dedicated
    serializer rather than a bare list-of-lists field, so the API response
    has named keys instead of positional ["Jan 2026", "1200.00"] pairs a
    client would have to remember the order of.
    """

    label = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


class RevenueAnalyticsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    currency = serializers.CharField(read_only=True)
    by_month = RevenueByMonthSerializer(many=True, read_only=True)

    def to_representation(self, instance):
        # RevenueAnalytics.by_month is a list of (str, Decimal) tuples, not
        # objects with .label/.amount attributes, and RevenueAnalytics is a
        # frozen dataclass so instance.by_month can't be reassigned in
        # place (that would raise FrozenInstanceError). Build a plain dict
        # with the adapted shape instead of mutating the input.
        return {
            "total_revenue": instance.total_revenue,
            "currency": instance.currency,
            "by_month": [
                {"label": label, "amount": amount}
                for label, amount in instance.by_month
            ],
        }


class TicketSalesSummarySerializer(serializers.Serializer):
    total_sold = serializers.IntegerField(read_only=True)
    total_available = serializers.IntegerField(read_only=True)


class CheckInStatisticsSerializer(serializers.Serializer):
    total_checked_in = serializers.IntegerField(read_only=True)
    total_expected = serializers.IntegerField(read_only=True)


class QRScanStatisticsSerializer(serializers.Serializer):
    total_scans = serializers.IntegerField(read_only=True)
    valid_scans = serializers.IntegerField(read_only=True)
    invalid_scans = serializers.IntegerField(read_only=True)


# ==================== ORGANIZER DASHBOARD: ORDERS & ATTENDEES ====================


class OrderSummarySerializer(serializers.Serializer):
    order_id = serializers.IntegerField(read_only=True)
    buyer_name = serializers.CharField(read_only=True)
    event_name = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    placed_at = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)


class AttendeeSummarySerializer(serializers.Serializer):
    attendee_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    ticket_status = serializers.CharField(read_only=True)
    checked_in = serializers.BooleanField(read_only=True)


# ==================== ADMIN DASHBOARD ====================


class AdminPlatformStatisticsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField(read_only=True)
    total_organizers = serializers.IntegerField(read_only=True)
    pending_events = serializers.IntegerField(read_only=True)
    active_events = serializers.IntegerField(read_only=True)


class AdminRevenueStatisticsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    total_successful_payments = serializers.IntegerField(read_only=True)

