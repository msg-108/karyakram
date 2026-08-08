import logging
import qrcode
from io import BytesIO
import jwt
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.bookings.models import Booking
from .models import Ticket
from .tasks import generate_ticket_qr_code

logger = logging.getLogger(__name__)


def list_user_tickets(user):
    """Return all tickets owned by the given user with select_related optimization."""
    return Ticket.objects.filter(booking__user=user).select_related(
        "booking__event", "booking_item__ticket_tier"
    )


def send_tickets_delivered_email(booking: Booking, tickets: list[Ticket]) -> None:
    try:
        from apps.common.email import send_email

        attachments = []
        for ticket in tickets:
            if ticket.qr_code_image:
                attachments.append(
                    (f"ticket_{ticket.id}.png", ticket.qr_code_image.read(), "image/png")
                )

        send_email(
            to=booking.user.email,
            subject=f"Your Tickets for {booking.event.title}",
            template_prefix="emails/tickets_delivered",
            context={
                "user": booking.user,
                "event": booking.event,
            },
            attachments=attachments if attachments else None,
            user=booking.user,
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send tickets delivered email")


def generate_qr_jwt(ticket: Ticket) -> str:
    """
    Generate a signed JWT containing the ticket ID and expiration.
    Kept streamlined and minimal to optimize QR code block size for fast scanning on low-quality cameras.
    """
    payload = {
        "ticket_id": str(ticket.id),
        "event_id": ticket.booking.event_id,
        "exp": int(ticket.booking.event.end_datetime.timestamp()),
    }
    return jwt.encode(payload, settings.QR_JWT_SECRET_KEY, algorithm="HS256")


def generate_qr_image(ticket: Ticket) -> ContentFile:
    """
    Generate a high-contrast, low-density QR code image optimized for low-resolution phone cameras.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=14,
        border=3,
    )
    qr.add_data(ticket.qr_code_payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=f"ticket_{ticket.id}.png")


@transaction.atomic
def generate_tickets_for_booking(booking: Booking) -> list[Ticket]:
    """
    Create Ticket records for each item in a confirmed booking.
    Called automatically after successful payment/booking confirmation.
    """
    if booking.status != Booking.Status.CONFIRMED:
        raise ValidationError("Tickets can only be generated for confirmed bookings.")

    if booking.tickets.exists():
        return list(booking.tickets.all())

    tickets_to_create = []

    for item in booking.items.all():
        for _ in range(item.quantity):
            tickets_to_create.append(
                Ticket(
                    booking=booking,
                    booking_item=item,
                    attendee_name=booking.user.username,
                    attendee_email=booking.user.email,
                )
            )

    tickets = Ticket.objects.bulk_create(tickets_to_create)

    # Generate QR payloads synchronously, but offload image generation
    tickets_to_update = []
    for ticket in tickets:
        ticket.qr_code_payload = generate_qr_jwt(ticket)
        tickets_to_update.append(ticket)

    Ticket.objects.bulk_update(tickets_to_update, ["qr_code_payload"])

    # Dispatch async task for image generation
    for ticket in tickets:
        generate_ticket_qr_code.delay(str(ticket.id))

    transaction.on_commit(
        lambda _booking=booking, _tickets=tickets: send_tickets_delivered_email(
            _booking, _tickets
        )
    )

    return tickets


@transaction.atomic
def check_in_ticket(qr_payload: str, event_id: int) -> Ticket:
    """
    Mark a ticket as checked in. Ensures the ticket belongs to the correct event
    and hasn't expired, been checked in already, or cancelled.
    """
    try:
        decoded = jwt.decode(qr_payload, settings.QR_JWT_SECRET_KEY, algorithms=["HS256"])
        ticket_id = decoded["ticket_id"]
    except jwt.ExpiredSignatureError:
        raise ValidationError("This ticket QR code has expired because the event has ended.")
    except jwt.InvalidSignatureError:
        try:
            decoded = jwt.decode(qr_payload, settings.SECRET_KEY, algorithms=["HS256"])
            ticket_id = decoded["ticket_id"]
        except jwt.ExpiredSignatureError:
            raise ValidationError("This ticket QR code has expired because the event has ended.")
        except jwt.PyJWTError:
            raise ValidationError("Invalid or corrupted ticket QR code.")
    except jwt.PyJWTError:
        raise ValidationError("Invalid or corrupted ticket QR code.")

    try:
        # Use select_for_update to prevent double check-ins
        ticket = (
            Ticket.objects.select_for_update()
            .select_related("booking__event")
            .get(id=ticket_id)
        )
    except Ticket.DoesNotExist:
        raise ValidationError("Ticket not found.")

    if ticket.booking.event.end_datetime < timezone.now():
        raise ValidationError("This event has already ended. Ticket QR code is expired.")

    if ticket.booking.event_id != event_id:
        raise ValidationError("Ticket is not valid for this event.")

    from apps.bookings.models import Booking

    if (
        ticket.booking.status == Booking.Status.CANCELLED
        or ticket.status == Ticket.Status.CANCELLED
    ):
        raise ValidationError("Ticket has been cancelled.")

    if ticket.status == Ticket.Status.CHECKED_IN:
        raise ValidationError("Ticket has already been checked in.")

    ticket.status = Ticket.Status.CHECKED_IN
    ticket.checked_in_at = timezone.now()
    ticket.save(update_fields=["status", "checked_in_at", "updated_at"])

    return ticket
