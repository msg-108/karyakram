import uuid
from django.db import models
from apps.bookings.models import Booking, BookingItem

class Ticket(models.Model):
    class Status(models.TextChoices):
        VALID = "VALID", "Valid"
        CHECKED_IN = "CHECKED_IN", "Checked In"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="tickets")
    booking_item = models.ForeignKey(BookingItem, on_delete=models.CASCADE, related_name="tickets")
    
    # Attendee details (defaults to booking user if not specified)
    attendee_name = models.CharField(max_length=255)
    attendee_email = models.EmailField(blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VALID)
    
    qr_code_payload = models.TextField(help_text="Signed JWT for the QR code", blank=True)
    qr_code_image = models.ImageField(upload_to="tickets/qrcodes/", blank=True, null=True)
    
    checked_in_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["booking"]),
            models.Index(fields=["booking_item"]),
        ]

    def __str__(self) -> str:
        return f"Ticket {self.id} for Booking #{self.booking_id} ({self.get_status_display()})"
