"""
Database models for the events app.

Four models, in dependency order:
- EventCategory: admin-managed taxonomy, independent of everything else.
- Event: owned by an OrganizerProfile (apps.users), goes through the
  draft -> submitted -> approved -> published workflow described below.
- EventImage: optional gallery images for an Event.
- TicketTier: defines ticket *types* for an Event (name/price/quantity)
  only. It is not a booking, order, or payment — see the module docstring
  in services.py for why those are deliberately out of scope here.

This app owns schema for events themselves and nothing else. Bookings,
payments, invoices, QR tickets, attendees, and check-ins belong to future
apps that will each carry their own FK onto Event/TicketTier — this app
does not anticipate their shape beyond leaving those two models in place
for them to point at.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from .validators import (
    validate_capacity,
    validate_event_image,
    validate_event_schedule,
    validate_remaining_quantity,
    validate_ticket_quantity,
)


class EventCategory(models.Model):
    """
    Admin-managed taxonomy for events (e.g. "Music", "Workshop",
    "Conference"). Deliberately has no owner/organizer — categories are a
    shared, curated list, not user-generated content.
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional icon identifier (e.g. an icon-library key) for frontend display.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive categories are hidden from public browsing/filtering but are "
        "kept rather than deleted so existing events don't lose their category.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "event_categories"
        verbose_name = "Event Category"
        verbose_name_plural = "Event Categories"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Event(models.Model):
    """
    A single event listing owned by an organizer.

    Workflow (enforced in services.py, not here — models only define
    schema):

        DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED
                      \\-> REJECTED (back to organizer for edits)

    Organizers can only ever reach SUBMITTED; only an admin action can move
    an event to APPROVED/REJECTED, and only an admin action can move an
    APPROVED event to PUBLISHED. Organizers must never be able to publish
    directly — see services.publish_event and permissions.CanApproveEvent.

    `visibility` is independent of `status`: it controls whether a
    PUBLISHED event is publicly listed (PUBLIC) or only reachable by direct
    link (UNLISTED), not whether it has been approved.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted for Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        UNLISTED = "UNLISTED", "Unlisted"

    organizer = models.ForeignKey(
        "users.OrganizerProfile",
        on_delete=models.CASCADE,
        related_name="events",
    )
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.PROTECT,
        related_name="events",
        help_text="PROTECT rather than CASCADE/SET_NULL: a category with live events "
        "attached should not be deletable out from under them.",
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    short_description = models.CharField(
        max_length=300,
        help_text="Short summary shown in listing/search results.",
    )
    description = models.TextField()
    terms_and_conditions = models.TextField(blank=True)

    # --- Location ---
    venue = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=150)
    district = models.CharField(max_length=150, blank=True)
    province = models.CharField(max_length=150, blank=True)


    banner = models.ImageField(
        upload_to="events/banners/",
        validators=[validate_event_image],
        null=True,
        blank=True,
    )

    # --- Schedule ---
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    registration_deadline = models.DateTimeField(null=True, blank=True)

    capacity = models.PositiveIntegerField(validators=[validate_capacity])

    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # --- Admin review trail ---
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events"
        verbose_name = "Event"
        verbose_name_plural = "Events"
        ordering = ["-start_datetime"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["visibility", "status"]),
            models.Index(fields=["organizer", "status"]),
            models.Index(fields=["start_datetime"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"

    def clean(self) -> None:
        super().clean()
        validate_event_schedule(
            start_datetime=self.start_datetime,
            end_datetime=self.end_datetime,
            registration_deadline=self.registration_deadline,
        )

    @property
    def is_public(self) -> bool:
        return (
            self.status == self.Status.PUBLISHED
            and self.visibility == self.Visibility.PUBLIC
        )

    @property
    def is_editable(self) -> bool:
        """Organizers may only edit while an event hasn't yet entered review."""
        return self.status in (self.Status.DRAFT, self.Status.REJECTED)


class EventImage(models.Model):
    """Optional gallery image belonging to an Event, beyond its single banner."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="gallery_images"
    )
    image = models.ImageField(
        upload_to="events/gallery/", validators=[validate_event_image]
    )
    caption = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "event_images"
        verbose_name = "Event Image"
        verbose_name_plural = "Event Images"
        ordering = ["display_order", "id"]
        indexes = [
            models.Index(fields=["event", "display_order"]),
        ]

    def __str__(self) -> str:
        return f"Image for {self.event.title} (#{self.display_order})"


class TicketTier(models.Model):
    """
    Defines one ticket *type* for an Event (e.g. "General", "VIP") — its
    name, price, and how many are available. This is deliberately not a
    booking/order: it has no concept of who purchased a ticket. That
    belongs to a future bookings/tickets app, which will hold its own
    model with a FK to this one.

    `price` may be zero: payments aren't implemented yet, and a free tier
    is also a legitimate real-world case this shouldn't block.
    """

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="ticket_tiers"
    )

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(validators=[validate_ticket_quantity])
    remaining_quantity = models.PositiveIntegerField(
        help_text="Set to `quantity` on creation. Will be decremented by the future "
        "bookings app as tickets are sold; this app only initializes and "
        "validates it, it does not decrement it itself.",
    )
    display_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive tiers are hidden from public purchase flows without deleting "
        "their history.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ticket_tiers"
        verbose_name = "Ticket Tier"
        verbose_name_plural = "Ticket Tiers"
        ordering = ["display_order", "id"]
        indexes = [
            models.Index(fields=["event", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} — {self.event.title}"

    def clean(self) -> None:
        super().clean()
        validate_remaining_quantity(
            quantity=self.quantity, remaining_quantity=self.remaining_quantity
        )

    @property
    def is_sold_out(self) -> bool:
        return self.remaining_quantity <= 0
