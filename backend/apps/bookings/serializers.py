"""
Input/output validation only — no business logic. BookingCreateSerializer's
create() delegates to services.create_booking, which does the actual work
— same convention as `events`.

Only structural/type validation lives here (event exists, quantity is a
positive integer, at least one item present). Everything that requires a
database lock or reads live inventory state — does the tier belong to the
event, is there enough remaining_quantity, is the event actually published
— is deliberately NOT duplicated here the way events duplicates its
schedule check in both the serializer and the service. Re-checking
inventory here would read remaining_quantity outside of
select_for_update()'s lock, so a value validated at the serializer layer
could already be stale by the time the service re-reads it under lock a
few lines later — reporting it as if it were still authoritative would be
actively misleading, not just redundant.
"""
from __future__ import annotations

from rest_framework import serializers

from apps.events.models import Event

from . import services
from .models import Booking, BookingItem


# ==================== BOOKING: CREATE (INPUT) ====================


class BookingItemInputSerializer(serializers.Serializer):
    """One requested line of a BookingCreateSerializer's `items` list."""

    ticket_tier = serializers.IntegerField(min_value=1, source="ticket_tier_id")
    quantity = serializers.IntegerField(min_value=1)


class BookingCreateSerializer(serializers.Serializer):
    """
    Input shape for POST /bookings/:

        { "event": 1, "items": [{ "ticket_tier": 1, "quantity": 2 }] }

    A plain Serializer, not a ModelSerializer, since nothing here maps
    1:1 onto Booking's own fields — `items` doesn't exist as a Booking
    field at all, and `total_amount`/`status` are computed by the service,
    never accepted as input. `event` is a bare IntegerField (not a
    PrimaryKeyRelatedField) so a nonexistent event ID is rejected inside
    services.create_booking as a business-logic ValidationError alongside
    the "must be PUBLISHED" check it already does, rather than as a
    separately-worded serializer-layer error for the same underlying
    problem (event not usable).
    """

    event = serializers.IntegerField(min_value=1)
    items = BookingItemInputSerializer(many=True)

    def validate_items(self, items: list[dict]) -> list[dict]:
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    def create(self, validated_data: dict) -> Booking:
        user = self.context["user"]
        event_id = validated_data["event"]

        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise serializers.ValidationError({"event": "Event does not exist."})

        return services.create_booking(user=user, event=event, items=validated_data["items"])


# ==================== BOOKING: READ (OUTPUT) ====================


class BookingItemSerializer(serializers.ModelSerializer):
    """Read-only line item, nested inside BookingDetailSerializer/BookingListSerializer."""

    ticket_tier_name = serializers.CharField(source="ticket_tier.name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = BookingItem
        fields = [
            "id",
            "ticket_tier",
            "ticket_tier_name",
            "quantity",
            "price_at_purchase",
            "subtotal",
        ]
        read_only_fields = fields


class BookingListSerializer(serializers.ModelSerializer):
    """
    Compact shape for GET /bookings/ — includes items (a user's booking
    list is typically short, and knowing *what* was booked without a
    second request per row is worth the join, unlike events' equivalent
    list serializer which omits long text fields for a different reason:
    payload size on a potentially-long public list).
    """

    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start_datetime = serializers.DateTimeField(source="event.start_datetime", read_only=True)
    items = BookingItemSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "event",
            "event_title",
            "event_start_datetime",
            "status",
            "total_amount",
            "items",
            "created_at",
        ]
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Full read shape for GET /bookings/{id}/ — same fields as the list
    serializer today, kept as a distinct class since a detail view
    predictably grows fields (e.g. `payment` once BookingPayment is real)
    that the list view won't want.
    """

    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start_datetime = serializers.DateTimeField(source="event.start_datetime", read_only=True)
    event_venue = serializers.CharField(source="event.venue", read_only=True)
    items = BookingItemSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "event",
            "event_title",
            "event_start_datetime",
            "event_venue",
            "status",
            "total_amount",
            "items",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields