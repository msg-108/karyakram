import logging

from celery import shared_task
from django.utils import timezone
from django.db import transaction

from apps.bookings.models import Booking
from apps.events.models import TicketTier
from apps.bookings.services import send_booking_email_by_id

logger = logging.getLogger(__name__)


@shared_task
def cancel_expired_bookings_task():
    """
    Finds PENDING bookings whose hold_expires_at has passed,
    marks them EXPIRED, and restores ticket quantities.
    """
    now = timezone.now()
    expired_bookings = Booking.objects.filter(
        status=Booking.Status.PENDING,
        hold_expires_at__lt=now
    )
    
    count = 0
    for booking in expired_bookings:
        try:
            _expire_booking(booking)
            count += 1
            logger.info(f"Expired booking {booking.id}")
        except Exception as e:
            logger.error(f"Failed to expire booking {booking.id}: {str(e)}")
            
    return f"Successfully expired {count} bookings."


@transaction.atomic
def _expire_booking(booking: Booking):
    # We need to lock the TicketTiers in order, just like create_booking and cancel_booking
    item_tier_ids_sorted = sorted(
        booking.items.values_list("ticket_tier_id", flat=True)
    )

    for tier_id in item_tier_ids_sorted:
        tier = TicketTier.objects.select_for_update().get(pk=tier_id)
        item = booking.items.get(ticket_tier_id=tier_id)
        tier.remaining_quantity += item.quantity
        tier.save(update_fields=["remaining_quantity", "updated_at"])

    booking.status = Booking.Status.EXPIRED
    booking.hold_expires_at = None
    booking.save(update_fields=["status", "hold_expires_at", "updated_at"])

    transaction.on_commit(
        lambda _id=booking.id: send_booking_email_by_id(_id, action="cancelled")
    )
