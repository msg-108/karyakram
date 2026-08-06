import logging
from celery import shared_task
from apps.events.services import auto_archive_ended_events

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
