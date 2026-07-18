"""
Business logic for the bookings app. Views stay thin and call these;
models and serializers stay dumb. Same convention as `events`/`users`:
each service raises DRF's ValidationError/PermissionDenied on failure so
views can let exceptions propagate to DRF's default exception handler
rather than re-wrapping responses themselves.

This app owns booking/reservation state only. It deliberately does not
implement payment processing or QR ticket generation — see the module
docstring in models.py for where those belong. create_booking below is
written so that inserting a real payment step later (charge first, then
call this / call this then charge) requires touching this function, but
not the concurrency-critical section inside it — see that function's
docstring.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.events.models import Event, TicketTier
from apps.users.models import User

from .models import Booking, BookingItem

logger = logging.getLogger(__name__)


# ==================== BOOKING: CREATE ====================


def _normalize_items(items: list[dict]) -> dict[int, int]:
    """
    Collapse the caller's item list into {ticket_tier_id: total_quantity},
    merging duplicate tier IDs by summing their quantities rather than
    treating a repeated tier as a client error. A client sending the same
    tier twice in one request (e.g. a naive frontend that doesn't dedupe
    cart lines before submitting) is far more likely to be an honest
    accumulation than a deliberate attempt to bypass validation, and
    summing is exactly what the eventual BookingItem row should reflect —
    see the unique_tier_per_booking constraint on BookingItem.
    """
    normalized: dict[int, int] = {}
    for item in items:
        tier_id = item["ticket_tier_id"]
        quantity = item["quantity"]
        normalized[tier_id] = normalized.get(tier_id, 0) + quantity
    return normalized


def send_booking_email(booking: Booking):
    subject = f"Booking Confirmation: {booking.event.title} (Booking #{booking.id})"
    message = f"Hello {booking.user.first_name or booking.user.username},\n\nYour booking for the event '{booking.event.title}' has been confirmed!\n\nBooking ID: #{booking.id}\nVenue: {booking.event.venue}, {booking.event.city}\nDate & Time: {booking.event.start_datetime}\n\nTotal Paid: Rs. {booking.total_amount}\n\nThank you for using Karyakram!"
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.exception("Failed to send booking confirmation email")


@transaction.atomic
def create_booking(*, user: User, event: Event, items: list[dict]) -> Booking:
    """
    Create a Booking + its BookingItems for `user` against `event`, atomically
    deducting TicketTier.remaining_quantity as it goes.

    `items` is [{ "ticket_tier_id": int, "quantity": int }, ...] — plain
    dicts rather than validated-tier instances, since resolving each tier
    is itself part of what this function must do under lock (see below);
    a caller cannot safely fetch tiers ahead of time and hand them in.

    Bookings are created already-CONFIRMED, not PENDING: this project has
    no payment step yet (see the models.py module docstring), and a
    PENDING booking that nothing ever confirms would hold sold-out
    inventory in limbo forever with no expiry mechanism to release it.
    Introducing real payment collection later most plausibly means this
    function starts by creating a PENDING booking and a separate
    confirm_booking(booking) service performs the status flip once payment
    succeeds — the inventory-locking section below would not change
    either way, since remaining_quantity must be reserved at booking
    time regardless of when payment happens, or two users could both be
    told "payment page loading" for the same last seat.

    ---- CONCURRENCY: why select_for_update() here, specifically ----

    Two requests booking the last remaining ticket of the same tier at
    the same moment is the exact race this function exists to prevent.
    Without locking, both requests could:
      1. Read remaining_quantity=1 (both pass the "enough left" check)
      2. Both write remaining_quantity=0
      3. Both succeed — one ticket oversold.

    `TicketTier.objects.select_for_update().get(pk=tier_id)` takes a
    row-level lock in the database itself (a `SELECT ... FOR UPDATE`),
    not an application-level lock — locking here only works because this
    whole function runs inside @transaction.atomic. The second concurrent
    request blocks at this line until the first request's transaction
    commits or rolls back, at which point it re-reads the now-current
    remaining_quantity rather than the stale value it would have read had
    it started earlier. This turns a check-then-write race into a
    strictly serialized sequence of check-then-write operations, so the
    second request either sees enough stock (both should would be able
    to book) or blocks (the first is still deciding) — it can never see
    the same "1 remaining" the first request already claimed.

    Locks are always acquired in a fixed order — ascending `ticket_tier_id`
    — regardless of the order the caller listed items in. Two bookings
    that both touch tiers A and B but request them in opposite order
    (booking 1: A then B; booking 2: B then A) could otherwise deadlock,
    each holding the lock the other is waiting for. Sorting first means
    every concurrent caller acquires locks in the same global order, so
    that specific deadlock shape cannot occur.
    """
    if not items:
        raise ValidationError({"items": "At least one item is required to create a booking."})

    if event.status not in [Event.Status.APPROVED, Event.Status.PUBLISHED]:
        raise ValidationError({"detail": "Tickets can only be booked for an approved or published event."})

    if event.registration_deadline is not None and timezone.now() > event.registration_deadline:
        raise ValidationError({"detail": "The registration deadline for this event has passed."})

    tier_quantities = _normalize_items(items)
    tier_ids_sorted = sorted(tier_quantities.keys())  # fixed lock order — see docstring above

    total_amount = Decimal("0")
    booking_items_to_create: list[BookingItem] = []

    booking = Booking(user=user, event=event, status=Booking.Status.CONFIRMED, total_amount=Decimal("0"))
    booking.save()  # PK needed below to construct BookingItem rows; total_amount corrected before returning

    for tier_id in tier_ids_sorted:
        quantity = tier_quantities[tier_id]

        if quantity <= 0:
            raise ValidationError({"items": f"Quantity for ticket tier {tier_id} must be greater than zero."})

        # select_for_update() row-locks this TicketTier for the rest of
        # this transaction — see the concurrency note in the docstring
        # above for why this specific line is what prevents overselling.
        try:
            tier = TicketTier.objects.select_for_update().get(pk=tier_id)
        except TicketTier.DoesNotExist:
            raise ValidationError({"items": f"Ticket tier {tier_id} does not exist."})

        if tier.event_id != event.id:
            raise ValidationError(
                {"items": f"Ticket tier {tier_id} does not belong to event {event.id}."}
            )

        if not tier.is_active:
            raise ValidationError({"items": f"Ticket tier '{tier.name}' is not currently available."})

        if tier.remaining_quantity < quantity:
            raise ValidationError(
                {
                    "items": (
                        f"Only {tier.remaining_quantity} of '{tier.name}' remaining, "
                        f"but {quantity} were requested."
                    )
                }
            )

        # The deduction itself. Safe from the race described above only
        # because select_for_update() above already holds this row's lock.
        tier.remaining_quantity -= quantity
        tier.save(update_fields=["remaining_quantity", "updated_at"])

        line_total = tier.price * quantity
        total_amount += line_total

        booking_items_to_create.append(
            BookingItem(
                booking=booking,
                ticket_tier=tier,
                quantity=quantity,
                price_at_purchase=tier.price,
            )
        )

    BookingItem.objects.bulk_create(booking_items_to_create)

    booking.total_amount = total_amount
    booking.save(update_fields=["total_amount", "updated_at"])

    transaction.on_commit(
        lambda: send_booking_email(booking)
    )

    return booking


# ==================== BOOKING: CANCEL ====================


@transaction.atomic
def cancel_booking(booking: Booking, *, user: User) -> Booking:
    """
    Cancel a CONFIRMED booking and restore each item's quantity back onto
    its TicketTier.remaining_quantity. Locking follows the same pattern
    and rationale as create_booking: select_for_update() on each tier
    (in a fixed, ascending-id order) so a cancellation restoring stock
    can never race with a concurrent booking consuming it.

    Ownership is checked here, not only at the permission-class layer,
    for the same reason submit_event_for_review in apps.events re-checks
    organizer ownership: this invariant must hold even if cancel_booking
    is ever called from somewhere other than the current view.
    """
    if booking.user_id != user.id:
        raise PermissionDenied("You do not have permission to cancel this booking.")

    if booking.status != Booking.Status.CONFIRMED:
        raise ValidationError({"detail": "Only confirmed bookings can be cancelled."})

    item_tier_ids_sorted = sorted(
        booking.items.values_list("ticket_tier_id", flat=True)
    )

    for tier_id in item_tier_ids_sorted:
        tier = TicketTier.objects.select_for_update().get(pk=tier_id)
        item = booking.items.get(ticket_tier_id=tier_id)
        tier.remaining_quantity += item.quantity
        tier.save(update_fields=["remaining_quantity", "updated_at"])

    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.save(update_fields=["status", "cancelled_at", "updated_at"])

    return booking


# ==================== BOOKING: LISTING ====================


def list_user_bookings(user: User) -> QuerySet[Booking]:
    """All of a user's own bookings, any status — this is their booking history, not a public view."""
    return (
        Booking.objects.filter(user=user)
        .select_related("event")
        .prefetch_related("items__ticket_tier")
    )


def get_user_booking(user: User, *, booking_id: int) -> Booking:
    """
    Fetch a single booking belonging to `user`, scoped by filtering on
    `user` before calling `.get()` rather than fetching by pk and then
    checking ownership. This means a booking that exists but belongs to
    someone else raises the same Booking.DoesNotExist as a booking_id that
    doesn't exist at all — the view (via get_object_or_404 against this
    same filtered queryset) turns that into an ordinary 404, so a caller
    poking at another user's booking IDs learns nothing more than they
    would from a random invalid ID.
    """
    return (
        Booking.objects.filter(user=user, pk=booking_id)
        .select_related("event")
        .prefetch_related("items__ticket_tier")
        .get()
    )