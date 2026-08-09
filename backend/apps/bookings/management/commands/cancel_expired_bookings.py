import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from apps.bookings.models import Booking
from apps.events.models import TicketTier
from apps.bookings.services import send_booking_email_by_id

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Finds PENDING bookings whose hold_expires_at has passed, marks them EXPIRED, and restores ticket quantities."

    def handle(self, *args, **options):
        from apps.bookings.tasks import cancel_expired_bookings_task
        result = cancel_expired_bookings_task()
        self.stdout.write(self.style.SUCCESS(result))
