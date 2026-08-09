import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.events.services import auto_archive_ended_events, send_event_reminder_email
from apps.bookings.models import Booking

logger = logging.getLogger(__name__)


@shared_task
def auto_archive_ended_events_task() -> str:
    """
    Periodic task to find PUBLISHED events whose end_datetime has passed
    and transition them to ARCHIVED status.
    """
    try:
        count = auto_archive_ended_events()
        return f"Successfully auto-archived {count} ended event(s)."
    except Exception as e:
        logger.error(f"Error auto-archiving ended events: {str(e)}")
        raise


@shared_task
def send_event_reminders_task() -> str:
    """
    Periodic task to find confirmed bookings for events starting in approximately 24 hours
    (between 23 and 25 hours from now) and send reminder emails once per booking.
    """
    now = timezone.now()
    window_start = now + timedelta(hours=23)
    window_end = now + timedelta(hours=25)

    upcoming_bookings = Booking.objects.filter(
        status=Booking.Status.CONFIRMED,
        is_reminder_sent=False,
        event__start_datetime__range=(window_start, window_end)
    ).select_related("user", "event")

    count = 0
    for booking in upcoming_bookings:
        try:
            send_event_reminder_email(booking)
            booking.is_reminder_sent = True
            booking.save(update_fields=["is_reminder_sent"])
            count += 1
        except Exception as e:
            logger.error(f"Failed to send reminder for booking #{booking.id}: {str(e)}")

    return f"Sent {count} 24-hour event reminder email(s)."
