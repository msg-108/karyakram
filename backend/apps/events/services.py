"""
Business logic for the events app. Views stay thin and call these; models
and serializers stay dumb. Same convention as `users`/`dashboard`: each
service raises DRF's ValidationError/PermissionDenied (or a subclass) on
failure so views can let exceptions propagate to DRF's default exception
handler rather than re-wrapping responses themselves.

This app owns event management only. It deliberately does not implement
bookings, payments, invoices, QR tickets, attendee management, or
check-ins — those belong to future apps that will each hold their own
model with a FK onto Event/TicketTier. TicketTier here only defines ticket
*types*; nothing in this file decrements TicketTier.remaining_quantity,
since that happens at booking time, which this app doesn't implement.
"""

from __future__ import annotations

import logging

from django.db import transaction
from django.db.models import Q, QuerySet
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.users.models import OrganizerProfile, User
from apps.common.email import send_email

from .models import Event, EventCategory, TicketTier
from .validators import validate_event_schedule, validate_remaining_quantity

logger = logging.getLogger(__name__)


# ==================== SLUGS ====================


def _generate_unique_slug(*, title: str, model, exclude_pk: int | None = None) -> str:
    """
    Shared slug-uniqueness logic for both Event and EventCategory. Appends
    `-2`, `-3`, ... on collision rather than raising, since the caller
    (create_event/create_category) never asks the user for a slug — it's
    always derived from the title/name, so a collision is not a user
    error to surface, just something to resolve silently.
    """
    base_slug = slugify(title)[: base_max_length(model)] or "item"
    slug = base_slug
    queryset = model.objects.all()
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)

    counter = 2
    while queryset.filter(slug=slug).exists():
        suffix = f"-{counter}"
        slug = f"{base_slug[: base_max_length(model) - len(suffix)]}{suffix}"
        counter += 1
    return slug


def base_max_length(model) -> int:
    return model._meta.get_field("slug").max_length


# ==================== CATEGORIES ====================


def create_category(*, validated_data: dict) -> EventCategory:
    category = EventCategory(**validated_data)
    if not category.slug:
        category.slug = _generate_unique_slug(title=category.name, model=EventCategory)
    category.full_clean()
    category.save()
    return category


def update_category(category: EventCategory, *, validated_data: dict) -> EventCategory:
    for field, value in validated_data.items():
        setattr(category, field, value)
    category.full_clean()
    category.save()
    return category


def delete_category(category: EventCategory) -> None:
    """
    Category deletion is blocked at the database level (on_delete=PROTECT
    on Event.category) if any event still references it — that constraint
    is intentionally not duplicated here as a pre-check; letting the
    ProtectedError surface (mapped to a 500 by DRF's default handler
    unless the caller catches it) matches the rest of this codebase's
    rule that services don't swallow/rewrap and views don't catch, so a
    genuinely-unexpected integrity error is not made to look like
    validation failure.
    """
    category.delete()


# ==================== EVENT: ORGANIZER WORKFLOW ====================


@transaction.atomic
def create_event(*, organizer: OrganizerProfile, validated_data: dict) -> Event:
    """Create a new event in DRAFT status, owned by `organizer`."""
    ticket_tiers_data = validated_data.pop("ticket_tiers", None)

    if not ticket_tiers_data:
        raise ValidationError(
            {
                "ticket_tiers": "At least one ticket tier is required when creating an event."
            }
        )

    validate_event_schedule(
        start_datetime=validated_data["start_datetime"],
        end_datetime=validated_data["end_datetime"],
        registration_deadline=validated_data.get("registration_deadline"),
    )

    event = Event(organizer=organizer, status=Event.Status.DRAFT, **validated_data)
    if not event.slug:
        event.slug = _generate_unique_slug(title=event.title, model=Event)
    event.full_clean()
    event.save()

    for tier_data in ticket_tiers_data:
        _create_ticket_tier_for_event(event, validated_data=tier_data)

    return event


@transaction.atomic
def update_event(event: Event, *, validated_data: dict) -> Event:
    """
    Update a DRAFT or REJECTED event's own fields. Only callable while
    `event.is_editable` — enforced here, not just left to the view/
    permission layer, so this invariant holds even if update_event is
    ever called from somewhere other than the current PATCH view.
    """
    if not event.is_editable:
        raise ValidationError(
            {"detail": "This event can no longer be edited in its current status."}
        )

    for field, value in validated_data.items():
        setattr(event, field, value)

    validate_event_schedule(
        start_datetime=event.start_datetime,
        end_datetime=event.end_datetime,
        registration_deadline=event.registration_deadline,
    )

    # A rejected event moves back to DRAFT the moment the organizer starts
    # editing it again — otherwise it would stay REJECTED forever with no
    # path back to SUBMITTED.
    if event.status == Event.Status.REJECTED:
        event.status = Event.Status.DRAFT
        event.rejection_reason = ""

    event.full_clean()
    event.save()
    return event


@transaction.atomic
def delete_event(event: Event) -> None:
    """
    Only DRAFT/REJECTED events may be deleted outright. Anything that has
    reached SUBMITTED or later should be archived instead (see
    archive_event), so a public/approved listing can't simply disappear.
    """
    if event.status not in (Event.Status.DRAFT, Event.Status.REJECTED):
        raise ValidationError(
            {
                "detail": "Only draft or rejected events can be deleted. Archive it instead."
            }
        )
    event.delete()


@transaction.atomic
def submit_event_for_review(event: Event, *, organizer: OrganizerProfile) -> Event:
    """
    Move a DRAFT/REJECTED event to SUBMITTED. Requires the organizer to be
    admin-approved — an organizer whose own account is still pending
    approval must not be able to put events into the review queue.
    """
    if not organizer.user.is_approved:
        raise PermissionDenied("Only approved organizers may submit events for review.")

    if event.organizer_id != organizer.id:
        raise PermissionDenied("You do not own this event.")

    if event.status not in (Event.Status.DRAFT, Event.Status.REJECTED):
        raise ValidationError(
            {"detail": "Only draft or rejected events can be submitted for review."}
        )

    if not event.ticket_tiers.exists():
        raise ValidationError(
            {
                "detail": "At least one ticket tier is required before submitting for review."
            }
        )

    event.status = Event.Status.SUBMITTED
    event.rejection_reason = ""
    event.save(update_fields=["status", "rejection_reason", "updated_at"])

    transaction.on_commit(lambda: send_event_submitted_email(event))
    transaction.on_commit(lambda: send_admin_event_pending_email(event))

    return event


# ==================== EVENT: ADMIN REVIEW ====================


def send_event_submitted_email(event: Event) -> None:
    send_email(
        to=event.organizer.user.email,
        subject="Event submitted for review",
        template_prefix="emails/event_submitted",
        context={"event": event, "organizer": event.organizer},
        user=event.organizer.user,
    )


def send_admin_event_pending_email(event: Event) -> None:
    from django.conf import settings

    admin_emails = User.objects.filter(is_superuser=True, is_active=True).values_list(
        "email", flat=True
    )
    if not admin_emails:
        admin_emails = [settings.DEFAULT_FROM_EMAIL]

    for admin_email in admin_emails:
        send_email(
            to=admin_email,
            subject="New Event Pending Review",
            template_prefix="emails/admin_event_pending",
            context={"event": event},
            user=event.organizer.user,
        )


def send_event_approved_email(event: Event) -> None:
    send_email(
        to=event.organizer.user.email,
        subject="Your event has been approved",
        template_prefix="emails/event_approved",
        context={"event": event, "organizer": event.organizer},
        user=event.organizer.user,
    )


def send_event_rejected_email(event: Event, reason: str) -> None:
    send_email(
        to=event.organizer.user.email,
        subject="Update on your event submission",
        template_prefix="emails/event_rejected",
        context={"event": event, "organizer": event.organizer, "reason": reason},
        user=event.organizer.user,
    )


def send_event_published_email(event: Event) -> None:
    send_email(
        to=event.organizer.user.email,
        subject="Your event is now live!",
        template_prefix="emails/event_published",
        context={"event": event, "organizer": event.organizer},
        user=event.organizer.user,
    )


def send_event_sold_out_email(event: Event) -> None:
    try:
        send_email(
            to=event.organizer.user.email,
            subject=f"{event.title} is Officially Sold Out!",
            template_prefix="emails/event_sold_out",
            context={"event": event, "organizer": event.organizer},
            user=event.organizer.user,
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send event sold out email")


def send_event_cancelled_email_to_attendees(event: Event, reason: str = "") -> None:
    from apps.bookings.models import Booking

    confirmed_bookings = Booking.objects.filter(
        event=event, status=Booking.Status.CONFIRMED
    ).select_related("user")

    for booking in confirmed_bookings:
        try:
            send_email(
                to=booking.user.email,
                subject=f"IMPORTANT: {event.title} Has Been Cancelled",
                template_prefix="emails/event_cancelled",
                context={"user": booking.user, "event": event, "reason": reason},
                user=booking.user,
                fail_silently=True,
            )
        except Exception:
            logger.exception(
                f"Failed to send event cancellation email to user {booking.user_id}"
            )


def send_event_rescheduled_email_to_attendees(event: Event) -> None:
    from apps.bookings.models import Booking

    confirmed_bookings = Booking.objects.filter(
        event=event, status=Booking.Status.CONFIRMED
    ).select_related("user")

    for booking in confirmed_bookings:
        try:
            send_email(
                to=booking.user.email,
                subject=f"UPDATE: Schedule Change for {event.title}",
                template_prefix="emails/event_rescheduled",
                context={"user": booking.user, "event": event},
                user=booking.user,
                fail_silently=True,
            )
        except Exception:
            logger.exception(
                f"Failed to send event rescheduled email to user {booking.user_id}"
            )


def send_event_reminder_email(booking) -> None:
    try:
        send_email(
            to=booking.user.email,
            subject=f"Reminder: {booking.event.title} is Tomorrow!",
            template_prefix="emails/event_reminder",
            context={"user": booking.user, "event": booking.event},
            user=booking.user,
            fail_silently=True,
        )
    except Exception:
        logger.exception(
            f"Failed to send event reminder email for booking {booking.id}"
        )


@transaction.atomic
def approve_event(event: Event, *, admin: User) -> Event:
    if event.status != Event.Status.SUBMITTED:
        raise ValidationError({"detail": "Only submitted events can be approved."})

    event.status = Event.Status.APPROVED
    event.approved_by = admin
    event.approved_at = timezone.now()
    event.rejection_reason = ""
    event.save(
        update_fields=[
            "status",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "updated_at",
        ]
    )

    transaction.on_commit(lambda: send_event_approved_email(event))
    return event


@transaction.atomic
def reject_event(event: Event, *, admin: User, reason: str) -> Event:
    if not reason.strip():
        raise ValidationError({"reason": "A rejection reason is required."})

    if event.status != Event.Status.SUBMITTED:
        raise ValidationError({"detail": "Only submitted events can be rejected."})

    event.status = Event.Status.REJECTED
    event.approved_by = admin
    event.approved_at = None
    event.rejection_reason = reason
    event.save(
        update_fields=[
            "status",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "updated_at",
        ]
    )

    transaction.on_commit(lambda: send_event_rejected_email(event, reason))
    return event


@transaction.atomic
def publish_event(event: Event, *, admin: User) -> Event:
    """
    Only an admin can call this — organizers must never be able to
    publish directly (see the workflow note on the Event model). Requires
    APPROVED status: publishing is a distinct admin action from approving,
    not an automatic side effect of approve_event, so an admin can approve
    an event today and choose to publish it later (e.g. once ticket tiers
    are finalized).
    """
    if event.status != Event.Status.APPROVED:
        raise ValidationError({"detail": "Only approved events can be published."})

    event.status = Event.Status.PUBLISHED
    event.published_at = timezone.now()
    event.save(update_fields=["status", "published_at", "updated_at"])

    transaction.on_commit(lambda: send_event_published_email(event))

    return event


@transaction.atomic
def archive_event(event: Event) -> Event:
    """
    Archiving removes a PUBLISHED (or otherwise no-longer-active) event
    from public listings without deleting it or its history. Distinct
    from delete_event, which is only for events that never went live.
    """
    if event.status == Event.Status.DRAFT:
        raise ValidationError(
            {"detail": "Draft events should be deleted, not archived."}
        )

    event.status = Event.Status.ARCHIVED
    event.save(update_fields=["status", "updated_at"])
    return event


@transaction.atomic
def auto_archive_ended_events() -> int:
    """
    Finds all PUBLISHED events whose end_datetime is in the past
    and bulk updates their status to ARCHIVED. Returns the count of archived events.
    """
    now = timezone.now()
    ended_events = Event.objects.filter(
        status=Event.Status.PUBLISHED,
        end_datetime__lt=now,
    )
    count = ended_events.update(
        status=Event.Status.ARCHIVED,
        updated_at=now,
    )
    if count > 0:
        logger.info(f"Auto-archived {count} ended event(s).")
    return count



# ==================== EVENT: LISTING & DISCOVERY ====================


def list_public_events() -> QuerySet[Event]:
    """Base queryset for anything public-facing: approved/published + public visibility + future/ongoing events only."""
    return Event.objects.filter(
        status=Event.Status.PUBLISHED,
        visibility=Event.Visibility.PUBLIC,
        end_datetime__gte=timezone.now(),
    ).select_related("organizer", "category")


def list_organizer_events(organizer: OrganizerProfile) -> QuerySet[Event]:
    """All of an organizer's own events, regardless of status — this is their workspace, not a public view."""
    return Event.objects.filter(organizer=organizer).select_related("category")


def list_pending_events() -> QuerySet[Event]:
    """Admin review queue: events awaiting a decision."""
    return Event.objects.filter(
        status__in=[Event.Status.SUBMITTED, Event.Status.APPROVED]
    ).select_related("organizer", "category")


def search_events(queryset: QuerySet[Event], *, query: str) -> QuerySet[Event]:
    """
    Free-text search strictly over event title only.
    """
    if not query:
        return queryset

    clean_query = query.strip()
    return queryset.filter(title__icontains=clean_query)


def filter_events(
    queryset: QuerySet[Event],
    *,
    category_slug: str | None = None,
    city: str | None = None,
    start_date_from=None,
    start_date_to=None,
) -> QuerySet[Event]:
    """Composable filtering, same rationale as search_events: takes/returns a queryset."""
    if category_slug:
        queryset = queryset.filter(category__slug=category_slug)
    if city:
        queryset = queryset.filter(city__iexact=city)
    if start_date_from:
        queryset = queryset.filter(start_datetime__gte=start_date_from)
    if start_date_to:
        queryset = queryset.filter(start_datetime__lte=start_date_to)
    return queryset


# ==================== TICKET TIERS ====================


def _create_ticket_tier_for_event(event: Event, *, validated_data: dict) -> TicketTier:
    """
    Shared by create_event's inline-tier creation and the standalone
    create_ticket_tier endpoint. `remaining_quantity` is always initialized
    to `quantity` here rather than accepted as caller input — a brand-new
    tier cannot start partially sold.
    """
    quantity = validated_data.pop("quantity")
    tier = TicketTier(
        event=event,
        quantity=quantity,
        remaining_quantity=quantity,
        **validated_data,
    )
    tier.full_clean()
    tier.save()
    return tier


@transaction.atomic
def create_ticket_tier(event: Event, *, validated_data: dict) -> TicketTier:
    if not event.is_editable:
        raise ValidationError(
            {"detail": "Ticket tiers can only be added while the event is a draft."}
        )
    return _create_ticket_tier_for_event(event, validated_data=validated_data)


@transaction.atomic
def update_ticket_tier(tier: TicketTier, *, validated_data: dict) -> TicketTier:
    if not tier.event.is_editable:
        raise ValidationError(
            {"detail": "Ticket tiers can only be edited while the event is a draft."}
        )

    quantity = validated_data.get("quantity", tier.quantity)
    remaining_quantity = validated_data.get(
        "remaining_quantity", tier.remaining_quantity
    )

    for field, value in validated_data.items():
        setattr(tier, field, value)

    validate_remaining_quantity(
        quantity=quantity, remaining_quantity=remaining_quantity
    )

    tier.full_clean()
    tier.save()
    return tier


@transaction.atomic
def delete_ticket_tier(tier: TicketTier) -> None:
    if not tier.event.is_editable:
        raise ValidationError(
            {"detail": "Ticket tiers can only be removed while the event is a draft."}
        )
    tier.delete()



