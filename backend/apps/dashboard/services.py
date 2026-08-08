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

    real query once apps.tickets.models.Ticket exists, e.g.
    `Ticket.objects.filter(user=user, event__start_at__gte=timezone.now())`.
    Field names here are chosen to match what that model will plausibly
    expose, so the serializer shouldn't need to change shape later.
    """

    ticket_id: str
    event_title: str
    event_date_time: datetime
    event_location: str
    seat_or_tier: str
    status: str


def list_upcoming_tickets(user: User) -> list[TicketSummary]:
    from apps.tickets.models import Ticket
    from django.utils import timezone

    tickets = Ticket.objects.filter(
        booking__user=user, booking__event__start_datetime__gte=timezone.now()
    ).select_related("booking__event", "booking_item__ticket_tier")

    return [
        TicketSummary(
            ticket_id=str(t.id),
            event_title=t.booking.event.title,
            event_date_time=t.booking.event.start_datetime,
            event_location=t.booking.event.venue,
            seat_or_tier=t.booking_item.ticket_tier.name,
            status=t.get_status_display(),
        )
        for t in tickets
    ]


def list_ticket_history(user: User) -> list[TicketSummary]:
    from apps.tickets.models import Ticket

    tickets = Ticket.objects.filter(booking__user=user).select_related(
        "booking__event", "booking_item__ticket_tier"
    )

    return [
        TicketSummary(
            ticket_id=str(t.id),
            event_title=t.booking.event.title,
            event_date_time=t.booking.event.start_datetime,
            event_location=t.booking.event.venue,
            seat_or_tier=t.booking_item.ticket_tier.name,
            status=t.get_status_display(),
        )
        for t in tickets
    ]


def get_ticket_receipt_image(user: User, *, ticket_id: str) -> bytes:
    from apps.tickets.models import Ticket
    from rest_framework.exceptions import PermissionDenied, NotFound

    try:
        ticket = Ticket.objects.select_related("booking").get(id=ticket_id)
    except Ticket.DoesNotExist:
        raise NotFound("Ticket not found.")

    if ticket.booking.user != user:
        raise PermissionDenied("You do not have permission to view this ticket.")

    if not ticket.qr_code_image:
        raise FeatureNotYetAvailable("QR Code image not yet generated.")

    return ticket.qr_code_image.read()


# ==================== USER DASHBOARD: PAYMENTS ====================


@dataclass(frozen=True)
class PaymentSummary:
    """
    One row of a user's payment history.

    apps.payments.models.Payment exists.
    """

    payment_id: int
    amount: Decimal
    currency: str
    status: str
    paid_at: datetime | None
    event_title: str


def list_payment_history(user: User) -> list[PaymentSummary]:
    from apps.payments.models import Payment

    payments = Payment.objects.filter(booking__user=user).select_related(
        "booking__event"
    )

    return [
        PaymentSummary(
            payment_id=p.id,
            amount=p.amount,
            currency="NPR",  # Or store currency in Payment model
            status=p.get_status_display(),
            paid_at=p.updated_at if p.status == Payment.Status.COMPLETED else None,
            event_title=p.booking.event.title,
        )
        for p in payments
    ]


# ==================== USER DASHBOARD: EVENTS & ACTIVITY ====================


@dataclass(frozen=True)
class EventSummary:
    """
    One row of an events list (upcoming events a user might attend, or an
    organizer's own events).
    """

    event_id: int
    title: str
    date_time: datetime
    location: str
    organizer_name: str
    total_tickets_issued: int = 0
    checked_in_count: int = 0
    attendance_percentage: float = 0.0


def list_upcoming_events(user: User) -> list[EventSummary]:
    from apps.events.models import Event
    from django.utils import timezone

    events = Event.objects.filter(
        status=Event.Status.PUBLISHED, start_datetime__gte=timezone.now()
    ).select_related("organizer__user")

    return [
        EventSummary(
            event_id=e.id,
            title=e.title,
            date_time=e.start_datetime,
            location=e.venue,
            organizer_name=e.organizer.user.username,
        )
        for e in events
    ]


@dataclass(frozen=True)
class ActivityItem:
    """
    One row of a user's recent-activity feed (e.g. "booked a ticket",
    "email verified", "payment completed"). Deliberately generic — this is
    the one placeholder shape likely to aggregate across several future
    apps at once rather than map to a single one.

    tickets/payments/events exists to generate activity from.
    """

    occurred_at: datetime
    description: str


def list_recent_activity(user: User, *, limit: int = 20) -> list[ActivityItem]:
    from apps.bookings.models import Booking
    from apps.payments.models import Payment

    activities = []

    bookings = Booking.objects.filter(user=user).order_by("-created_at")[:limit]
    for b in bookings:
        activities.append(
            ActivityItem(
                occurred_at=b.created_at,
                description=f"Booked tickets for {b.event.title} (Status: {b.get_status_display()})",
            )
        )

    payments = Payment.objects.filter(booking__user=user).order_by("-created_at")[
        :limit
    ]
    for p in payments:
        if p.status == Payment.Status.COMPLETED:
            activities.append(
                ActivityItem(
                    occurred_at=p.updated_at,
                    description=f"Completed payment of Rs. {p.amount} for {p.booking.event.title}",
                )
            )

    activities.sort(key=lambda x: x.occurred_at, reverse=True)
    return activities[:limit]


# ==================== NOTIFICATIONS (future-ready, shared shape) ====================


@dataclass(frozen=True)
class NotificationSummary:
    """
    One notification. Shared shape for both USER and ORGANIZER dashboards
    since notifications aren't role-specific.

    apps.notifications.models.Notification exists. That app should own
    read/unread state and delivery; this function should only ever read
    from it, matching the "dashboard aggregates, doesn't own" rule.
    """

    notification_id: int
    message: str
    created_at: datetime
    is_read: bool


def list_notifications(
    user: User, *, unread_only: bool = False
) -> list[NotificationSummary]:
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
    from apps.events.models import Event
    from apps.tickets.models import Ticket

    events = Event.objects.filter(organizer=profile).order_by("-start_datetime")
    result = []
    for e in events:
        tickets = Ticket.objects.filter(booking__event=e).exclude(
            status=Ticket.Status.CANCELLED
        )
        total_issued = tickets.count()
        checked_in = tickets.filter(status=Ticket.Status.CHECKED_IN).count()
        pct = (
            round((checked_in / total_issued * 100), 1) if total_issued > 0 else 0.0
        )
        result.append(
            EventSummary(
                event_id=e.id,
                title=e.title,
                date_time=e.start_datetime,
                location=e.venue,
                organizer_name=profile.user.username,
                total_tickets_issued=total_issued,
                checked_in_count=checked_in,
                attendance_percentage=pct,
            )
        )
    return result


def list_organizer_upcoming_events(profile: OrganizerProfile) -> list[EventSummary]:
    from apps.events.models import Event
    from apps.tickets.models import Ticket
    from django.utils import timezone

    events = Event.objects.filter(
        organizer=profile, start_datetime__gte=timezone.now()
    ).order_by("start_datetime")

    result = []
    for e in events:
        tickets = Ticket.objects.filter(booking__event=e).exclude(
            status=Ticket.Status.CANCELLED
        )
        total_issued = tickets.count()
        checked_in = tickets.filter(status=Ticket.Status.CHECKED_IN).count()
        pct = (
            round((checked_in / total_issued * 100), 1) if total_issued > 0 else 0.0
        )
        result.append(
            EventSummary(
                event_id=e.id,
                title=e.title,
                date_time=e.start_datetime,
                location=e.venue,
                organizer_name=profile.user.username,
                total_tickets_issued=total_issued,
                checked_in_count=checked_in,
                attendance_percentage=pct,
            )
        )
    return result


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

    """

    total_events: int = 0
    total_tickets_sold: int = 0
    total_attendees_checked_in: int = 0


def get_event_statistics(profile: OrganizerProfile) -> EventStatistics:
    from apps.events.models import Event
    from apps.tickets.models import Ticket

    total_events = Event.objects.filter(organizer=profile).count()
    tickets = Ticket.objects.filter(booking__event__organizer=profile)

    total_tickets_sold = tickets.exclude(status=Ticket.Status.CANCELLED).count()
    total_checked_in = tickets.filter(status=Ticket.Status.CHECKED_IN).count()

    return EventStatistics(
        total_events=total_events,
        total_tickets_sold=total_tickets_sold,
        total_attendees_checked_in=total_checked_in,
    )


@dataclass(frozen=True)
class RevenueAnalytics:
    """
    Aggregate revenue for an organizer.

    apps.payments.models.Payment exists. `by_month` is deliberately a
    plain list of (label, amount) pairs rather than a dict, since the
    analytics-chart consumer (frontend or a future export service) will
    want an ordered series, not an unordered mapping.
    """

    total_revenue: Decimal = Decimal("0.00")
    currency: str = "NPR"
    by_month: list[tuple[str, Decimal]] = field(default_factory=list)


def get_revenue_analytics(profile: OrganizerProfile) -> RevenueAnalytics:
    from django.db.models import Sum
    from django.db.models.functions import TruncMonth
    from apps.payments.models import Payment

    payments = Payment.objects.filter(
        booking__event__organizer=profile, status=Payment.Status.COMPLETED
    )

    total = payments.aggregate(Sum("amount"))["amount__sum"] or Decimal("0.00")

    monthly = (
        payments.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

    by_month = [
        (m["month"].strftime("%b %Y"), m["total"])
        for m in monthly
        if m["month"] is not None
    ]

    return RevenueAnalytics(total_revenue=total, currency="NPR", by_month=by_month)


@dataclass(frozen=True)
class TicketSalesSummary:

    total_sold: int = 0
    total_available: int = 0


def get_ticket_sales_summary(profile: OrganizerProfile) -> TicketSalesSummary:
    from django.db.models import Sum
    from apps.events.models import TicketTier
    from apps.tickets.models import Ticket

    total_available = (
        TicketTier.objects.filter(event__organizer=profile, is_active=True).aggregate(
            Sum("remaining_quantity")
        )["remaining_quantity__sum"]
        or 0
    )
    total_sold = (
        Ticket.objects.filter(booking__event__organizer=profile)
        .exclude(status=Ticket.Status.CANCELLED)
        .count()
    )

    return TicketSalesSummary(
        total_sold=total_sold,
        total_available=total_available + total_sold,
    )


@dataclass(frozen=True)
class CheckInStatistics:
    total_checked_in: int = 0
    total_expected: int = 0
    attendance_percentage: float = 0.0


def get_checkin_statistics(profile: OrganizerProfile) -> CheckInStatistics:
    from apps.tickets.models import Ticket

    tickets = Ticket.objects.filter(booking__event__organizer=profile).exclude(
        status=Ticket.Status.CANCELLED
    )
    total_expected = tickets.count()
    total_checked_in = tickets.filter(status=Ticket.Status.CHECKED_IN).count()
    pct = (
        round((total_checked_in / total_expected * 100), 1)
        if total_expected > 0
        else 0.0
    )

    return CheckInStatistics(
        total_checked_in=total_checked_in,
        total_expected=total_expected,
        attendance_percentage=pct,
    )


@dataclass(frozen=True)
class QRScanStatistics:
    total_scans: int = 0
    valid_scans: int = 0
    invalid_scans: int = 0


def get_qr_scan_statistics(profile: OrganizerProfile) -> QRScanStatistics:
    from apps.tickets.models import Ticket

    tickets = Ticket.objects.filter(booking__event__organizer=profile)
    checked_in = tickets.filter(status=Ticket.Status.CHECKED_IN).count()
    total_valid = tickets.exclude(status=Ticket.Status.CANCELLED).count()

    return QRScanStatistics(
        total_scans=checked_in,
        valid_scans=checked_in,
        invalid_scans=max(0, total_valid - checked_in),
    )


# ==================== ORGANIZER DASHBOARD: ORDERS & ATTENDEES ====================


@dataclass(frozen=True)
class OrderSummary:

    order_id: int
    buyer_name: str
    event_title: str
    amount: Decimal
    placed_at: datetime
    status: str


def list_recent_orders(
    profile: OrganizerProfile, *, limit: int = 20
) -> list[OrderSummary]:
    from apps.bookings.models import Booking

    bookings = (
        Booking.objects.filter(event__organizer=profile)
        .select_related("user", "event")
        .order_by("-created_at")[:limit]
    )

    return [
        OrderSummary(
            order_id=b.id,
            buyer_name=b.user.username,
            event_title=b.event.title,
            amount=b.total_amount,
            placed_at=b.created_at,
            status=b.get_status_display(),
        )
        for b in bookings
    ]


@dataclass(frozen=True)
class AttendeeSummary:

    attendee_name: str
    email: str
    ticket_status: str
    checked_in: bool


def list_event_attendees(
    profile: OrganizerProfile, *, event_id: int
) -> list[AttendeeSummary]:
    from apps.tickets.models import Ticket
    from rest_framework.exceptions import PermissionDenied
    from apps.events.models import Event

    try:
        event = Event.objects.get(id=event_id)
        if event.organizer != profile:
            raise PermissionDenied(
                "You do not have permission to view this event's attendees."
            )
    except Event.DoesNotExist:
        return []

    tickets = Ticket.objects.filter(booking__event_id=event_id).exclude(
        status=Ticket.Status.CANCELLED
    )

    return [
        AttendeeSummary(
            attendee_name=t.attendee_name,
            email=t.attendee_email,
            ticket_status=t.get_status_display(),
            checked_in=(t.status == Ticket.Status.CHECKED_IN),
        )
        for t in tickets
    ]


# ==================== ORGANIZER DASHBOARD: EXPORTS (future-ready) ====================


def export_report(profile: OrganizerProfile, *, report_type: str) -> bytes:
    """
    Generate a downloadable CSV report for an organizer's analytics.
    Supported types: 'sales', 'attendees'.
    """
    import csv
    from io import StringIO
    from apps.tickets.models import Ticket
    from apps.payments.models import Payment

    output = StringIO()
    writer = csv.writer(output)

    if report_type == "sales":
        writer.writerow(["Payment ID", "Event", "Amount", "Currency", "Status", "Date"])
        payments = (
            Payment.objects.filter(booking__event__organizer=profile)
            .select_related("booking__event")
            .order_by("-created_at")
        )

        for p in payments:
            writer.writerow(
                [
                    p.id,
                    p.booking.event.title,
                    p.amount,
                    "NPR",
                    p.get_status_display(),
                    p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

    elif report_type == "attendees":
        writer.writerow(
            ["Ticket ID", "Event", "Tier", "Attendee Name", "Attendee Email", "Status"]
        )
        tickets = (
            Ticket.objects.filter(booking__event__organizer=profile)
            .select_related("booking__event", "booking_item__ticket_tier")
            .order_by("-created_at")
        )

        for t in tickets:
            writer.writerow(
                [
                    t.id,
                    t.booking.event.title,
                    t.booking_item.ticket_tier.name,
                    t.attendee_name,
                    t.attendee_email,
                    t.get_status_display(),
                ]
            )

    else:
        raise ValueError(f"Unknown report type: {report_type}")

    return output.getvalue().encode("utf-8")


# ==================== ADMIN DASHBOARD: ANALYTICS ====================


@dataclass(frozen=True)
class AdminPlatformStatistics:
    """Platform-wide metrics for super admins."""

    total_users: int
    total_organizers: int
    pending_events: int
    active_events: int


def get_admin_platform_statistics(user: User) -> AdminPlatformStatistics:
    """Return platform-wide user and event counts."""
    from apps.users.models import User as AppUser
    from apps.events.models import Event

    return AdminPlatformStatistics(
        total_users=AppUser.objects.filter(role=AppUser.Role.USER).count(),
        total_organizers=AppUser.objects.filter(role=AppUser.Role.ORGANIZER).count(),
        pending_events=Event.objects.filter(status=Event.Status.SUBMITTED).count(),
        active_events=Event.objects.filter(status=Event.Status.PUBLISHED).count(),
    )


@dataclass(frozen=True)
class AdminRevenueStatistics:
    """Platform-wide revenue metrics for super admins."""

    total_revenue: Decimal
    total_successful_payments: int


def get_admin_revenue_statistics(user: User) -> AdminRevenueStatistics:
    """Return platform-wide revenue and payment counts."""
    from apps.payments.models import Payment
    from django.db.models import Sum

    completed_payments = Payment.objects.filter(status=Payment.Status.COMPLETED)
    total_rev = completed_payments.aggregate(Sum("amount"))["amount__sum"] or Decimal(
        "0.00"
    )

    return AdminRevenueStatistics(
        total_revenue=total_rev,
        total_successful_payments=completed_payments.count(),
    )
