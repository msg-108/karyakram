"""
Database models for the bookings app.

Three models, in dependency order:
- Booking: one purchase transaction by a user against a single Event. Holds
  the aggregate status/total; never holds ticket-tier quantities itself.
- BookingItem: one line item within a Booking — a quantity of a specific
  TicketTier, at the price that tier had *at the moment of purchase*.
- BookingPayment: placeholder only (see its docstring). Not wired into the
  booking flow yet — payments.services will own that once it exists.

This app owns booking/reservation state and nothing else. It reads
Event/TicketTier (apps.events) and User (apps.users) but never writes to
them except for TicketTier.remaining_quantity, which is the one field
apps.events explicitly leaves for a future booking app to decrement (see
apps.events.models.TicketTier's docstring) — see services.py for why that
decrement happens there and not here on the model.

QR ticket generation is intentionally out of scope for this app too: a
Booking/BookingItem is a purchase record, not an admission credential. A
future apps.tickets (or similarly-named) app will most plausibly hold one
QR-bearing row per admitted attendee with a FK onto BookingItem, mirroring
how TicketTier -> Booking works today.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models


class Booking(models.Model):
    """
    One purchase transaction: a user buying some quantity of one or more
    TicketTiers for a single Event, in a single atomic operation.

    `event` is denormalized onto Booking (rather than only reachable via
    `booking.items.first().ticket_tier.event`) because a booking with zero
    items should never be a valid state to query through, and because
    every real read path (a user's booking list/detail, an organizer's
    attendee list for one event) wants to filter/join on event directly.
    All of a booking's items are always for tiers belonging to this same
    event — enforced in services.create_booking, not at the database
    level, since a cross-event FK constraint isn't expressible without a
    composite key onto TicketTier.

    Status only ever moves PENDING -> CONFIRMED or PENDING -> CANCELLED.
    Nothing currently transitions a booking *into* PENDING and then holds
    it there before confirming — see services.create_booking's docstring
    for why bookings are created already-CONFIRMED today, and PENDING
    exists for the payments app to use once checkout is no longer
    instantaneous.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.PROTECT,
        related_name="bookings",
        help_text="PROTECT rather than CASCADE: an event with confirmed bookings "
        "attached should not be deletable out from under them. Events are "
        "archived, not deleted, once they have any real activity — see "
        "apps.events.services.delete_event.",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Sum of (quantity x price_at_purchase) across this booking's items, "
        "computed once at creation time. Not a property/annotation: it must "
        "survive unchanged even if TicketTier.price changes later, exactly "
        "like price_at_purchase on each BookingItem.",
    )

    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["event", "status"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Booking #{self.pk} — {self.event.title} ({self.get_status_display()})"

    @property
    def is_cancellable(self) -> bool:
        return self.status == self.Status.CONFIRMED


class BookingItem(models.Model):
    """
    One line item within a Booking: a quantity of a specific TicketTier.

    `price_at_purchase` intentionally duplicates TicketTier.price at the
    row level rather than reading it live off the FK. A tier's price can
    legitimately change after tickets against it have already been sold
    (an organizer editing a not-yet-started event, a future early-bird ->
    standard price change), and a past booking's total must never move
    when that happens — this is the same "snapshot the price" rule any
    order/line-item schema needs, and it is why Booking.total_amount is
    also stored rather than computed from current prices.

    `ticket_tier` uses PROTECT for the same reason `Booking.event` does:
    once a tier has sold bookings, apps.events won't let it be deleted
    (only deactivated via `TicketTier.is_active`), so nothing here needs
    to defend against a dangling FK.
    """

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="items")
    ticket_tier = models.ForeignKey(
        "events.TicketTier",
        on_delete=models.PROTECT,
        related_name="booking_items",
    )

    quantity = models.PositiveIntegerField()
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_items"
        verbose_name = "Booking Item"
        verbose_name_plural = "Booking Items"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["booking"]),
            models.Index(fields=["ticket_tier"]),
        ]
        constraints = [
            # One row per (booking, tier): services.create_booking merges
            # duplicate tier_id entries in the same request into a single
            # quantity up front (see _normalize_items), so this constraint
            # should never actually fire — it exists as a backstop against
            # a future caller bypassing that normalization, not as the
            # mechanism enforcing it.
            models.UniqueConstraint(
                fields=["booking", "ticket_tier"], name="unique_tier_per_booking"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} x {self.ticket_tier.name} (Booking #{self.booking_id})"

    @property
    def subtotal(self) -> Decimal:
        return self.price_at_purchase * self.quantity


class BookingPayment(models.Model):
    """
    Placeholder only — not created, read, or referenced anywhere in
    services.py/views.py yet. Included now purely so the FK target exists
    and the migration history doesn't need a disruptive schema change the
    day a real payments app lands, matching how apps.events already left
    TicketTier.remaining_quantity in place for this app to use rather than
    inventing it later.

    Deliberately minimal: no gateway-specific fields (Stripe payment
    intent IDs, Khalti/eSewa transaction refs, webhook payloads) since
    guessing that shape now is more likely to be wrong and need reworking
    than to save real effort later. A real payments app should most
    plausibly own its own richer model and may replace this one entirely
    rather than extend it — this is a reservation of intent, not a
    committed design.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payment")

    provider = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. 'stripe', 'khalti', 'esewa'. Blank until a real payments app sets it.",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking_payments"
        verbose_name = "Booking Payment"
        verbose_name_plural = "Booking Payments"

    def __str__(self) -> str:
        return f"Payment for Booking #{self.booking_id} ({self.get_status_display()})"