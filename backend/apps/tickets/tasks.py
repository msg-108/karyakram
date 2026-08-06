import logging
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from celery import shared_task

from apps.tickets.models import Ticket

logger = logging.getLogger(__name__)


@shared_task
def generate_ticket_qr_code(ticket_id: str):
    """
    Generates a QR code image for a given ticket ID using its qr_code_payload,
    and saves it to the qr_code_image field.
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        if not ticket.qr_code_payload:
            logger.warning(
                "Ticket %s has no qr_code_payload. Cannot generate QR code.", ticket_id
            )
            return

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(ticket.qr_code_payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")

        filename = f"ticket_{ticket.id}.png"
        ticket.qr_code_image.save(filename, ContentFile(buffer.getvalue()), save=True)

        logger.info("Successfully generated QR code for ticket %s", ticket_id)
    except Ticket.DoesNotExist:
        logger.error("Ticket %s not found for QR code generation.", ticket_id)
    except Exception as e:
        logger.exception(
            "Failed to generate QR code for ticket %s: %s", ticket_id, str(e)
        )
