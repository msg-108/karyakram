from rest_framework import serializers
from apps.bookings.serializers import BookingItemSerializer
from .models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    booking_item = BookingItemSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    
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
            "checked_in_at",
            "created_at",
        ]


class CheckInSerializer(serializers.Serializer):
    qr_payload = serializers.CharField(help_text="The scanned JWT string from the QR code")
