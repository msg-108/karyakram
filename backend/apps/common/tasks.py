import base64
import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def dispatch_email_task(
    self,
    to: list[str],
    subject: str,
    text_body: str,
    html_body: str | None,
    b64_attachments: list[tuple[str, str, str]] | None,
    reply_to: list[str] | None,
    fail_silently: bool,
):
    """
    Celery task that actually constructs and sends the EmailMultiAlternatives.
    Attachments must be passed as base64-encoded strings to survive JSON serialization.
    """
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to,
        reply_to=reply_to,
    )

    if html_body:
        message.attach_alternative(html_body, "text/html")

    if b64_attachments:
        for filename, b64_content, mime_type in b64_attachments:
            content = base64.b64decode(b64_content)
            message.attach(filename, content, mime_type)

    try:
        message.send(fail_silently=fail_silently)
    except Exception as exc:
        logger.exception("Failed to send async email to %s", to)
        if not fail_silently:
            raise self.retry(exc=exc, countdown=10)
