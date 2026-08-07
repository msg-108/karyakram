from rest_framework import serializers
from apps.bookings.serializers import BookingItemSerializer
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    booking_item = BookingItemSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    event_title = serializers.CharField(source="booking.event.title", read_only=True)
    event_start_datetime = serializers.DateTimeField(source="booking.event.start_datetime", read_only=True)
    event_end_datetime = serializers.DateTimeField(source="booking.event.end_datetime", read_only=True)
    event_venue = serializers.CharField(source="booking.event.venue", read_only=True)
    event_address = serializers.CharField(source="booking.event.address", read_only=True)
    event_city = serializers.CharField(source="booking.event.city", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "booking_id",
            "booking_item",
            "attendee_name",
            "attendee_email",
            "status",
            "status_display",
            "qr_code_payload",
            "qr_code_image",
            "event_title",
            "event_start_datetime",
            "event_end_datetime",
            "event_venue",
            "event_address",
            "event_city",
            "checked_in_at",
            "created_at",
        ]


class CheckInSerializer(serializers.Serializer):
    qr_payload = serializers.CharField(
        help_text="The scanned JWT string from the QR code"
    )
