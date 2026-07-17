"""
Business logic for the dashboard app. Views stay thin and call these;
serializers stay dumb. Same convention as `users`: each service raises
DRF's ValidationError (or a subclass) on failure so views can let
exceptions propagate to DRF's default exception handler.

Most of what a "dashboard" shows (tickets, payments, events, revenue,
check-ins, QR scans, notifications) is owned by apps that don't exist yet
in this project — only `users.User` and `users.OrganizerProfile` are real
today. Rather than invent schema for those other domains here (see
models.py for why not) or hardcode imports to apps that may not exist,
every such capability is implemented as a service function with a real,
documented signature and return shape, but a placeholder body that returns
empty/zeroed data. Each is marked with a TODO naming the future app whose
queryset will eventually replace the placeholder. The view/serializer/URL
layer above these functions is already final: swapping a placeholder body
for a real query is the only change needed once the owning app exists.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

from rest_framework.exceptions import APIException

from apps.users.models import OrganizerProfile, User

logger = logging.getLogger(__name__)


class FeatureNotYetAvailable(APIException):
    """
    Raised by placeholder services whose underlying app doesn't exist yet
    and which can't honestly return empty data (e.g. a PDF download) the
    way a placeholder list can. DRF ships no "not built yet" exception, so
    this fills that one gap — everything else still raises ValidationError
    or PermissionDenied directly, per the same rule this class exists to
    follow rather than break.
    """

    status_code = 501
    default_detail = "This feature is not yet available."
    default_code = "not_implemented"


# ==================== USER DASHBOARD: PROFILE SUMMARY ====================


@dataclass(frozen=True)
class UserProfileSummary:
    """Top-of-dashboard snapshot for a USER account."""

    user: User
    upcoming_ticket_count: int
    total_ticket_count: int
    unread_notification_count: int


def get_user_profile_summary(user: User) -> UserProfileSummary:
    """
    Assemble the USER dashboard's profile-summary card. The count fields
    call the same placeholder services used by the dedicated list
    endpoints, so the summary card and the full list it links to can never
    disagree about what "upcoming" or "unread" means.
    """
    upcoming_tickets = list_upcoming_tickets(user)
    all_tickets = list_ticket_history(user)
    notifications = list_notifications(user, unread_only=True)

    return UserProfileSummary(
        user=user,
        upcoming_ticket_count=len(upcoming_tickets),
        total_ticket_count=len(all_tickets),
        unread_notification_count=len(notifications),
    )


# ==================== USER DASHBOARD: TICKETS ====================


@dataclass(frozen=True)
class TicketSummary:
    """
    One row of a user's ticket list (upcoming or historical).

    TODO(tickets app): replace every placeholder function below with a
    real query once apps.tickets.models.Ticket exists, e.g.
    `Ticket.objects.filter(user=user, event__start_at__gte=timezone.now())`.
    Field names here are chosen to match what that model will plausibly
    expose, so the serializer shouldn't need to change shape later.
    """

    ticket_id: int
    event_title: str
    event_date_time: datetime
    event_location: str
    seat_or_tier: str
    status: str


def list_upcoming_tickets(user: User) -> list[TicketSummary]:
    """Tickets for events that haven't happened yet. Placeholder: no tickets app exists yet."""
    return []


def list_ticket_history(user: User) -> list[TicketSummary]:
    """All tickets ever booked by this user, past and future. Placeholder: no tickets app exists yet."""
    return []


def get_ticket_receipt_pdf(user: User, *, ticket_id: int) -> bytes:
    """
    Return the receipt PDF for one of the user's own tickets, as raw bytes
    for the view to serve with a PDF content type.

    Placeholder: no tickets/payments app exists yet, so there is nothing to
    look up or authorize against. Once apps.tickets exists, this must also
    verify the ticket belongs to `user` before returning anything — that
    ownership check belongs here, not in the view.
    """
    raise FeatureNotYetAvailable(
        "Receipt download is not yet available: the tickets app has not been built."
    )


# ==================== USER DASHBOARD: PAYMENTS ====================


@dataclass(frozen=True)
class PaymentSummary:
    """
    One row of a user's payment history.

    TODO(payments app): replace with a real query once
    apps.payments.models.Payment exists.
    """

    payment_id: int
    amount: Decimal
    currency: str
    status: str
    paid_at: datetime | None
    event_title: str


def list_payment_history(user: User) -> list[PaymentSummary]:
    """Placeholder: no payments app exists yet."""
    return []


# ==================== USER DASHBOARD: EVENTS & ACTIVITY ====================


@dataclass(frozen=True)
class EventSummary:
    """
    One row of an events list (upcoming events a user might attend, or an
    organizer's own events).

    TODO(events app): replace with a real query once
    apps.events.models.Event exists. `users` already has a migration
    dependency on an `events` app (see users/migrations/0003, which
    depends on events.0003_alter_event_organizer), so that app's schema
    may already exist in the wider project even though it wasn't included
    in what was shared for this task — confirm its actual field names
    before wiring this up for real, rather than assuming these ones match.
    """

    event_id: int
    title: str
    date_time: datetime
    location: str
    organizer_name: str


def list_upcoming_events(user: User) -> list[EventSummary]:
    """Events a user might want to attend/has interacted with. Placeholder: no events app exists yet."""
    return []


@dataclass(frozen=True)
class ActivityItem:
    """
    One row of a user's recent-activity feed (e.g. "booked a ticket",
    "email verified", "payment completed"). Deliberately generic — this is
    the one placeholder shape likely to aggregate across several future
    apps at once rather than map to a single one.

    TODO: replace with a real aggregation once at least one of
    tickets/payments/events exists to generate activity from.
    """

    occurred_at: datetime
    description: str


def list_recent_activity(user: User, *, limit: int = 20) -> list[ActivityItem]:
    """Placeholder: no source of activity events exists yet."""
    return []


# ==================== NOTIFICATIONS (future-ready, shared shape) ====================


@dataclass(frozen=True)
class NotificationSummary:
    """
    One notification. Shared shape for both USER and ORGANIZER dashboards
    since notifications aren't role-specific.

    TODO(notifications app): replace with a real query once
    apps.notifications.models.Notification exists. That app should own
    read/unread state and delivery; this function should only ever read
    from it, matching the "dashboard aggregates, doesn't own" rule.
    """

    notification_id: int
    message: str
    created_at: datetime
    is_read: bool


def list_notifications(user: User, *, unread_only: bool = False) -> list[NotificationSummary]:
    """Placeholder: no notifications app exists yet."""
    return []


# ==================== ORGANIZER DASHBOARD: PROFILE SUMMARY ====================


@dataclass(frozen=True)
class OrganizerProfileSummary:
    """Top-of-dashboard snapshot for an ORGANIZER account."""

    profile: OrganizerProfile
    total_events: int
    upcoming_events: int
    unread_notification_count: int


def get_organizer_profile_summary(profile: OrganizerProfile) -> OrganizerProfileSummary:
    """Assemble the ORGANIZER dashboard's profile-summary card."""
    events = list_organizer_events(profile)
    upcoming = list_organizer_upcoming_events(profile)
    notifications = list_notifications(profile.user, unread_only=True)

    return OrganizerProfileSummary(
        profile=profile,
        total_events=len(events),
        upcoming_events=len(upcoming),
        unread_notification_count=len(notifications),
    )


# ==================== ORGANIZER DASHBOARD: EVENTS ====================


def list_organizer_events(profile: OrganizerProfile) -> list[EventSummary]:
    """All events belonging to this organizer. Placeholder: no events app exists yet."""
    return []


def list_organizer_upcoming_events(profile: OrganizerProfile) -> list[EventSummary]:
    """This organizer's events that haven't started yet. Placeholder: no events app exists yet."""
    return []


# Deliberately no create_event / update_event / delete_event here. Event
# CRUD belongs to the future events app, not to dashboard — see the design
# discussion in this app's PR description. Adding fake CRUD against a
# nonexistent Event model would be exactly the kind of hardcoded
# assumption this app is meant to avoid.


# ==================== ORGANIZER DASHBOARD: STATISTICS & ANALYTICS ====================


@dataclass(frozen=True)
class EventStatistics:
    """
    Aggregate stats across an organizer's events (or, later, possibly
    scoped to a single event — signature takes the whole profile for now
    since there's no per-event model to scope to yet).

    TODO(events + tickets apps): replace with real aggregation queries.
    """

    total_events: int = 0
    total_tickets_sold: int = 0
    total_attendees_checked_in: int = 0


def get_event_statistics(profile: OrganizerProfile) -> EventStatistics:
    """Placeholder: no events/tickets apps exist yet."""
    return EventStatistics()


@dataclass(frozen=True)
class RevenueAnalytics:
    """
    Aggregate revenue for an organizer.

    TODO(payments app): replace with a real aggregation once
    apps.payments.models.Payment exists. `by_month` is deliberately a
    plain list of (label, amount) pairs rather than a dict, since the
    analytics-chart consumer (frontend or a future export service) will
    want an ordered series, not an unordered mapping.
    """

    total_revenue: Decimal = Decimal("0.00")
    currency: str = "NPR"
    by_month: list[tuple[str, Decimal]] = field(default_factory=list)


def get_revenue_analytics(profile: OrganizerProfile) -> RevenueAnalytics:
    """Placeholder: no payments app exists yet."""
    return RevenueAnalytics()


@dataclass(frozen=True)
class TicketSalesSummary:
    """TODO(tickets app): replace with a real aggregation."""

    total_sold: int = 0
    total_available: int = 0


def get_ticket_sales_summary(profile: OrganizerProfile) -> TicketSalesSummary:
    """Placeholder: no tickets app exists yet."""
    return TicketSalesSummary()


@dataclass(frozen=True)
class CheckInStatistics:
    """TODO(QR check-in app): replace with a real aggregation."""

    total_checked_in: int = 0
    total_expected: int = 0


def get_checkin_statistics(profile: OrganizerProfile) -> CheckInStatistics:
    """Placeholder: no QR check-in app exists yet."""
    return CheckInStatistics()


@dataclass(frozen=True)
class QRScanStatistics:
    """
    TODO(QR check-in app): replace with a real aggregation. Kept distinct
    from CheckInStatistics because a scan is not necessarily a successful
    check-in (e.g. an already-used or invalid code can still be scanned);
    conflating the two would lose that distinction once real data exists.
    """

    total_scans: int = 0
    valid_scans: int = 0
    invalid_scans: int = 0


def get_qr_scan_statistics(profile: OrganizerProfile) -> QRScanStatistics:
    """Placeholder: no QR check-in app exists yet."""
    return QRScanStatistics()


# ==================== ORGANIZER DASHBOARD: ORDERS & ATTENDEES ====================


@dataclass(frozen=True)
class OrderSummary:
    """TODO(payments/tickets apps): replace with a real query."""

    order_id: int
    buyer_name: str
    event_title: str
    amount: Decimal
    placed_at: datetime
    status: str


def list_recent_orders(profile: OrganizerProfile, *, limit: int = 20) -> list[OrderSummary]:
    """Placeholder: no payments/tickets apps exist yet."""
    return []


@dataclass(frozen=True)
class AttendeeSummary:
    """TODO(tickets app): replace with a real query, scoped to one event once Event exists."""

    attendee_name: str
    email: str
    ticket_status: str
    checked_in: bool


def list_event_attendees(profile: OrganizerProfile, *, event_id: int) -> list[AttendeeSummary]:
    """Placeholder: no events/tickets apps exist yet."""
    return []


# ==================== ORGANIZER DASHBOARD: EXPORTS (future-ready) ====================


def export_report(profile: OrganizerProfile, *, report_type: str) -> bytes:
    """
    Generate a downloadable report (CSV/PDF) for one of the analytics
    views above, as raw bytes for the view to serve.

    Placeholder: with every analytics source above itself a placeholder,
    there is nothing meaningful to export yet.
    """
    raise FeatureNotYetAvailable(
        "Report export is not yet available: the underlying analytics data sources have not been built."
    )