"""
Input/output validation only — no business logic. Every serializer's
create()/update() delegates to the matching function in services.py, which
does the actual work — same convention as `users`.

Separate serializer classes exist per audience (public / organizer / admin)
rather than one serializer with conditional fields, because each audience
is genuinely allowed to see/send a different field set (e.g. only an admin
should ever see/set `approved_by`), and encoding that as branching logic
in a single serializer would obscure exactly the permission boundary this
app needs to be explicit about.
"""

from __future__ import annotations

from rest_framework import serializers

from . import services
from .models import Event, EventCategory, TicketTier
from .validators import validate_capacity, validate_ticket_quantity

# ==================== CATEGORIES ====================


class EventCategorySerializer(serializers.ModelSerializer):
    """Full representation, used for both public browsing and admin management."""

    class Meta:
        model = EventCategory
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data: dict) -> EventCategory:
        return services.create_category(validated_data=validated_data)

    def update(self, instance: EventCategory, validated_data: dict) -> EventCategory:
        return services.update_category(instance, validated_data=validated_data)


# ==================== TICKET TIERS ====================


class TicketTierSerializer(serializers.ModelSerializer):
    """
    Used for both reading and organizer-side writing. `remaining_quantity`
    is read-only here even though it's a real model field: it is only ever
    set by services.py (initialized to `quantity` on creation, decremented
    later by the future bookings app), never supplied directly by a client.
    """

    quantity = serializers.IntegerField(validators=[validate_ticket_quantity])

    class Meta:
        model = TicketTier
        fields = [
            "id",
            "event",
            "name",
            "description",
            "price",
            "quantity",
            "remaining_quantity",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "remaining_quantity",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data: dict) -> TicketTier:
        event = self.context["event"]
        return services.create_ticket_tier(event, validated_data=validated_data)

    def update(self, instance: TicketTier, validated_data: dict) -> TicketTier:
        return services.update_ticket_tier(instance, validated_data=validated_data)


class TicketTierCreateInputSerializer(serializers.ModelSerializer):
    """
    Nested-input shape for ticket tiers supplied inline on
    OrganizerEventWriteSerializer (event creation). Excludes `event`
    entirely (unknown until the parent Event is created) and
    `remaining_quantity` (always derived from `quantity`), rather than
    marking them read-only on TicketTierSerializer and reusing it, since a
    read-only field silently dropped from nested input can mask a client
    mistake that this shape makes structurally impossible.
    """

    quantity = serializers.IntegerField(validators=[validate_ticket_quantity])

    class Meta:
        model = TicketTier
        fields = [
            "name",
            "description",
            "price",
            "quantity",
            "display_order",
            "is_active",
        ]





# ==================== EVENT: PUBLIC ====================


class PublicEventListSerializer(serializers.ModelSerializer):
    """
    Compact shape for list/search/filter results — omits long text fields
    (`description`, `terms_and_conditions`) that a listing view doesn't
    need and that would bloat a multi-result response.
    """

    category = EventCategorySerializer(read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.organization_name", read_only=True
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "short_description",
            "category",
            "organizer_name",
            "venue",
            "city",
            "banner",
            "start_datetime",
            "end_datetime",
        ]
        read_only_fields = fields


class PublicEventDetailSerializer(serializers.ModelSerializer):
    """Full public representation for a single event's detail page, by slug."""

    category = EventCategorySerializer(read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.organization_name", read_only=True
    )
    ticket_tiers = TicketTierSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "short_description",
            "description",
            "terms_and_conditions",
            "category",
            "organizer_name",
            "venue",
            "address",
            "city",
            "district",
            "province",
            "banner",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "ticket_tiers",
        ]
        read_only_fields = fields


# ==================== EVENT: ORGANIZER ====================


class OrganizerEventListSerializer(serializers.ModelSerializer):
    """Compact shape for an organizer's own event list — includes status/review fields a public list never shows."""

    category = EventCategorySerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "category",
            "status",
            "visibility",
            "start_datetime",
            "end_datetime",
            "rejection_reason",
        ]
        read_only_fields = fields


class OrganizerEventDetailSerializer(serializers.ModelSerializer):
    """Full read shape for one of an organizer's own events, including gallery/tiers and review state."""

    category = EventCategorySerializer(read_only=True)
    ticket_tiers = TicketTierSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "short_description",
            "description",
            "terms_and_conditions",
            "category",
            "venue",
            "address",
            "city",
            "district",
            "province",
            "banner",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "visibility",
            "status",
            "rejection_reason",
            "published_at",
            "ticket_tiers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "status",
            "rejection_reason",
            "published_at",
            "ticket_tiers",
            "created_at",
            "updated_at",
        ]


class OrganizerEventWriteSerializer(serializers.ModelSerializer):
    """
    Create/update shape for an organizer's own event. `category` is
    write-only-by-id here (a plain PrimaryKeyRelatedField) rather than
    nested-writable, since nested-writable serializers for FKs are
    generally fragile in DRF; reading back a created/updated event goes
    through OrganizerEventDetailSerializer instead, which nests the full
    EventCategorySerializer for display.

    `ticket_tiers` only accepts input on create (see services.create_event)
    — updating an existing event's tiers goes through the dedicated
    ticket-tier endpoints instead, so a PATCH to the event itself can't
    accidentally wipe or reorder tiers as a side effect.
    """

    category = serializers.PrimaryKeyRelatedField(
        queryset=EventCategory.objects.filter(is_active=True)
    )
    capacity = serializers.IntegerField(validators=[validate_capacity])
    ticket_tiers = TicketTierCreateInputSerializer(
        many=True, required=False, write_only=True
    )

    class Meta:
        model = Event
        fields = [
            "title",
            "short_description",
            "description",
            "terms_and_conditions",
            "category",
            "venue",
            "address",
            "city",
            "district",
            "province",
            "banner",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "visibility",
            "ticket_tiers",
        ]

    def to_internal_value(self, data):
        """
        When the request is multipart/form-data the DRF parser hands us a
        QueryDict.  A QueryDict value for 'ticket_tiers' will be a plain
        string (the JSON the frontend serialised before appending to FormData).
        We must parse it back into a list before the standard field validation
        runs; otherwise TicketTierCreateInputSerializer(many=True) receives a
        string instead of a list and either rejects it or silently drops it.
        """
        import json
        if hasattr(data, '_mutable'):
            # QueryDict — make mutable so we can replace the value
            data = data.copy()
        if 'ticket_tiers' in data and isinstance(data.get('ticket_tiers'), str):
            try:
                data['ticket_tiers'] = json.loads(data['ticket_tiers'])
            except (json.JSONDecodeError, ValueError):
                pass  # leave as-is; field-level validation will catch it
        return super().to_internal_value(data)

    def validate(self, attrs: dict) -> dict:
        """
        Cross-field schedule validation is enforced again in services.py
        (create_event/update_event) — duplicated here so a bad request is
        rejected at the serializer boundary with field-level errors,
        rather than only surfacing from deeper in the service layer. On
        update, missing fields fall back to the existing instance's
        values so a partial PATCH is validated against the event's
        eventual full state, not just the fields being changed.
        """
        start = attrs.get(
            "start_datetime", getattr(self.instance, "start_datetime", None)
        )
        end = attrs.get("end_datetime", getattr(self.instance, "end_datetime", None))
        deadline = attrs.get(
            "registration_deadline",
            getattr(self.instance, "registration_deadline", None),
        )

        if start and end:
            if end <= start:
                raise serializers.ValidationError(
                    {"end_datetime": "End date/time must be after the start date/time."}
                )
            if deadline and deadline > start:
                raise serializers.ValidationError(
                    {
                        "registration_deadline": (
                            "Registration deadline must be on or before the event's "
                            "start date/time."
                        )
                    }
                )
        return attrs

    def create(self, validated_data: dict) -> Event:
        organizer = self.context["organizer"]
        return services.create_event(organizer=organizer, validated_data=validated_data)

    def update(self, instance: Event, validated_data: dict) -> Event:
        # ticket_tiers is write_only=True and only meaningful on create;
        # silently ignored here rather than raised, since the docstring
        # above documents update-via-dedicated-endpoints as the supported
        # path, not a client error.
        validated_data.pop("ticket_tiers", None)
        return services.update_event(instance, validated_data=validated_data)

    def to_representation(self, instance: Event) -> dict:
        return OrganizerEventDetailSerializer(instance, context=self.context).data


# ==================== EVENT: ADMIN ====================


class AdminEventReviewSerializer(serializers.ModelSerializer):
    """
    Read shape for the admin review queue and for the response after an
    approve/reject action — surfaces `approved_by`/`approved_at` fields
    that neither the public nor organizer serializers expose.
    """

    category = EventCategorySerializer(read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.organization_name", read_only=True
    )
    approved_by_username = serializers.CharField(
        source="approved_by.username", read_only=True, default=None
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "category",
            "organizer_name",
            "status",
            "start_datetime",
            "end_datetime",
            "approved_by_username",
            "approved_at",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = fields


class AdminEventDetailSerializer(serializers.ModelSerializer):
    """
    Full read shape for admin event review — surfaces all content, location, schedule,
    ticket tiers, banner image, and review state.
    """

    category = EventCategorySerializer(read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.organization_name", read_only=True
    )
    organizer_email = serializers.CharField(
        source="organizer.user.email", read_only=True
    )
    approved_by_username = serializers.CharField(
        source="approved_by.username", read_only=True, default=None
    )
    ticket_tiers = TicketTierSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "slug",
            "title",
            "short_description",
            "description",
            "terms_and_conditions",
            "category",
            "organizer_name",
            "organizer_email",
            "venue",
            "address",
            "city",
            "district",
            "province",
            "banner",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "visibility",
            "status",
            "approved_by_username",
            "approved_at",
            "rejection_reason",
            "published_at",
            "ticket_tiers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class EventApprovalActionSerializer(serializers.Serializer):
    """
    Input for the approve/reject admin action. Same shape as
    apps.users.serializers.OrganizerApprovalActionSerializer, kept as a
    separate class rather than imported/shared, since the two actions are
    conceptually unrelated (organizer approval vs. event approval) even
    though their input happens to look identical today.
    """

    action = serializers.ChoiceField(choices=["approve", "reject"])
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["action"] == "reject" and not attrs.get("reason", "").strip():
            raise serializers.ValidationError(
                {"reason": "A reason is required when rejecting an event."}
            )
        return attrs
