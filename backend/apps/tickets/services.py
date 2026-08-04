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

logger = logging.getLogger(__name__)

def send_tickets_delivered_email(booking: Booking, tickets: list[Ticket]) -> None:
    try:
        from django.core.mail import EmailMultiAlternatives
        from django.template.loader import render_to_string

        context = {
            "user": booking.user,
            "event": booking.event,
            "settings": settings,
        }
        subject = f"Your Tickets for {booking.event.title}"
        text_body = render_to_string("emails/tickets_delivered.txt", context)
        html_body = render_to_string("emails/tickets_delivered.html", context)
        
        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
        msg.attach_alternative(html_body, "text/html")
        
        # Attach ticket QR codes
        for ticket in tickets:
            if ticket.qr_code_image:
                msg.attach(f"ticket_{ticket.id}.png", ticket.qr_code_image.read(), "image/png")
        
        msg.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send tickets delivered email")

def generate_qr_jwt(ticket: Ticket) -> str:
    """
    Generate a signed JWT containing the ticket's core details.
    This JWT is encoded into the QR code and scanned by organizers.
    """
    payload = {
        "ticket_id": str(ticket.id),
        "booking_id": ticket.booking_id,
        "event_id": ticket.booking.event_id,
        "attendee_email": ticket.attendee_email,
        "iat": timezone.now().timestamp(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def generate_qr_image(ticket: Ticket) -> ContentFile:
    """
    Generate a QR code image from the ticket's JWT.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
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
    
    # Generate QR codes for each ticket
    for ticket in tickets:
        ticket.qr_code_payload = generate_qr_jwt(ticket)
        # We don't save the image file immediately in bulk_create. We update it now.
        ticket.qr_code_image.save(
            f"ticket_{ticket.id}.png", 
            generate_qr_image(ticket), 
            save=True
        )

    transaction.on_commit(
        lambda _booking=booking, _tickets=tickets: send_tickets_delivered_email(_booking, _tickets)
    )

    return tickets


@transaction.atomic
def check_in_ticket(qr_payload: str, event_id: int) -> Ticket:
    """
    Mark a ticket as checked in. Ensures the ticket belongs to the correct event
    and hasn't been checked in already or cancelled.
    """
    try:
        decoded = jwt.decode(qr_payload, settings.SECRET_KEY, algorithms=["HS256"])
        ticket_id = decoded["ticket_id"]
    except jwt.PyJWTError:
        raise ValidationError("Invalid or corrupted ticket QR code.")

    try:
        # Use select_for_update to prevent double check-ins
        ticket = Ticket.objects.select_for_update().select_related("booking").get(id=ticket_id)
    except Ticket.DoesNotExist:
        raise ValidationError("Ticket not found.")

    if ticket.booking.event_id != event_id:
        raise ValidationError("Ticket is not valid for this event.")
        
    if ticket.status == Ticket.Status.CANCELLED:
        raise ValidationError("Ticket has been cancelled.")
        
    if ticket.status == Ticket.Status.CHECKED_IN:
        raise ValidationError("Ticket has already been checked in.")

    ticket.status = Ticket.Status.CHECKED_IN
    ticket.checked_in_at = timezone.now()
    ticket.save(update_fields=["status", "checked_in_at", "updated_at"])
    
    return ticket
