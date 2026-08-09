import logging

from celery import shared_task
from django.utils import timezone
from django.db import transaction

from apps.bookings.models import Booking
from apps.events.models import TicketTier
from apps.bookings.services import send_booking_email_by_id, confirm_booking
from apps.payments.models import Payment
from apps.payments.services import verify_esewa_payment
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


@shared_task
def cancel_expired_bookings_task():
    """
    Finds PENDING bookings whose hold_expires_at has passed,
    marks them EXPIRED, and restores ticket quantities.
    """
    now = timezone.now()
    expired_bookings = Booking.objects.filter(
        status=Booking.Status.PENDING, hold_expires_at__lt=now
    )

    count_expired = 0
    count_reconciled = 0
    for booking in expired_bookings:
        try:
            # Automatic Reconciliation: Check if they actually paid before expiring!
            if hasattr(booking, "payment") and booking.payment.status == Payment.Status.PENDING:
                if booking.payment.provider == Payment.Provider.ESEWA:
                    try:
                        # This will raise ValidationError if eSewa status is not COMPLETE
                        verified_payment = verify_esewa_payment(booking.payment)
                        if verified_payment.status == Payment.Status.COMPLETED:
                            logger.info(f"Auto-reconciled dropped callback for booking {booking.id}")
                            confirm_booking(booking)
                            count_reconciled += 1
                            continue # Skip expiration
                    except ValidationError:
                        pass # eSewa says it's not paid, proceed to expire

            _expire_booking(booking)
            count_expired += 1
            logger.info(f"Expired booking {booking.id}")
        except Exception as e:
            logger.error(f"Failed to process expired booking {booking.id}: {str(e)}")

    return f"Successfully expired {count_expired} bookings and auto-reconciled {count_reconciled} payments."


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
