"""
Centralized email sending utility. All apps import send_email() from here
instead of each app reimplementing its own _send_email() function.

Features over the old per-app approach:
- Single function signature for all transactional emails
- Automatic injection of common template context (site_url, current_year)
- Optional file attachments (for QR ticket PDFs, receipts)
- Staff-broadcast helper for admin alert emails
- Consistent error logging with structured extras
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
import base64

from .tasks import dispatch_email_task

logger = logging.getLogger(__name__)


def _send_email_direct(
    to: list[str],
    subject: str,
    text_body: str,
    html_body: str | None,
    attachments: list[tuple[str, bytes, str]] | None,
    reply_to: list[str] | None,
    fail_silently: bool,
) -> None:
    """Send email synchronously using EmailMultiAlternatives."""
    from django.core.mail import EmailMultiAlternatives

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to,
        reply_to=reply_to,
    )
    if html_body:
        message.attach_alternative(html_body, "text/html")
    if attachments:
        for filename, content, mime_type in attachments:
            message.attach(filename, content, mime_type)

    message.send(fail_silently=fail_silently)
    logger.info("[email-direct] Sent '%s' → %s", subject, to)


def send_email(
    *,
    to: str | list[str],
    subject: str,
    template_prefix: str,
    context: dict,
    attachments: list[tuple[str, bytes, str]] | None = None,
    reply_to: list[str] | None = None,
    user=None,
    fail_silently: bool = False,
) -> None:
    """
    Render {template_prefix}.txt (required) and {template_prefix}.html
    (optional) and send via the configured EMAIL_BACKEND.

    Arguments:
        to:               Recipient email address(es).
        subject:          Email subject line.
        template_prefix:  Path prefix without extension, e.g. "emails/otp_verification".
        context:          Template context dict (site_url and current_year are injected automatically).
        attachments:      Optional list of (filename, content_bytes, mime_type) tuples.
        reply_to:         Optional reply-to address(es).
        user:             Optional User instance for structured error logging.
    """
    # Inject common context for the base template
    context.setdefault(
        "site_url", getattr(settings, "SITE_URL", "http://localhost:5173")
    )
    context.setdefault("current_year", timezone.now().year)

    if isinstance(to, str):
        to = [to]

    text_body = render_to_string(f"{template_prefix}.txt", context)

    html_body = None
    try:
        html_body = render_to_string(f"{template_prefix}.html", context)
    except Exception:  # noqa: BLE001
        pass

    # Check if eager mode is explicitly enabled
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        try:
            _send_email_direct(
                to=to,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                attachments=attachments,
                reply_to=reply_to,
                fail_silently=fail_silently,
            )
            return
        except Exception:
            if not fail_silently:
                raise
            return

    # Base64 encode attachments for Celery JSON serialization
    b64_attachments = None
    if attachments:
        b64_attachments = [
            (filename, base64.b64encode(content).decode("ascii"), mime_type)
            for filename, content, mime_type in attachments
        ]

    try:
        dispatch_email_task.delay(
            to=to,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            b64_attachments=b64_attachments,
            reply_to=reply_to,
            fail_silently=fail_silently,
        )
    except Exception as exc:
        logger.warning(f"Celery dispatch failed ({exc}); falling back to direct email sending.")
        try:
            _send_email_direct(
                to=to,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                attachments=attachments,
                reply_to=reply_to,
                fail_silently=fail_silently,
            )
        except Exception:
            log_extra = {}
            if user is not None:
                log_extra = {
                    "user_id": getattr(user, "pk", None),
                    "email": getattr(user, "email", None),
                }
            logger.exception("Failed to send fallback email to %s", to, extra=log_extra)
            if not fail_silently:
                raise


def send_email_to_staff(*, subject: str, template_prefix: str, context: dict) -> None:
    """
    Send an email to all active staff/admin users.
    Used for admin alerts (new organizer pending, event submitted, etc.).
    """
    from apps.users.models import User

    staff_emails = list(
        User.objects.filter(is_staff=True, is_active=True).values_list(
            "email", flat=True
        )
    )
    if staff_emails:
        send_email(
            to=staff_emails,
            subject=subject,
            template_prefix=template_prefix,
            context=context,
        )
