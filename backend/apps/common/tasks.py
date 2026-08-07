import base64
import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

# Exponential back-off delays (seconds) between retries: 30s → 5min → 15min.
# This prevents a retry storm from burning through Gmail's daily quota.
_RETRY_DELAYS = [30, 300, 900]


@shared_task(
    bind=True,
    max_retries=3,
    # Hard rate limit: no more than 2 emails per minute sent by ALL workers combined.
    # Gmail free accounts allow ~500/day; 2/min = 2880/day so there is plenty of
    # headroom, and a registration burst of e.g. 10 users won't fire 10 simultaneous
    # SMTP connections that all count as separate sends against the quota.
    rate_limit="2/m",
    # Drop the task from the queue rather than silently lose it if the broker
    # restarts while the task is waiting in the rate-limit window.
    acks_late=True,
)
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
    Celery task that constructs and sends EmailMultiAlternatives.

    Rate-limited to 2 emails/minute to avoid hitting Gmail's free-tier daily
    sending cap (500/day). On SMTP failure the task retries up to 3 times with
    exponential back-off (30 s → 5 min → 15 min) rather than hammering the
    SMTP server every 10 seconds, which would exhaust the daily quota quickly.

    Attachments must be base64-encoded strings to survive JSON serialization.
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
        logger.info("[email] Sent '%s' → %s", subject, to)
    except Exception as exc:
        error_str = str(exc)
        retry_num = self.request.retries  # 0-indexed
        countdown = _RETRY_DELAYS[min(retry_num, len(_RETRY_DELAYS) - 1)]

        logger.warning(
            "[email] SMTP failure (attempt %d/%d) for '%s' → %s: %s. "
            "Retrying in %ds.",
            retry_num + 1, self.max_retries + 1, subject, to, error_str, countdown,
        )

        # Always print to console so developers can copy the OTP / content
        # manually during local development when Gmail quota is exhausted.
        print("\n" + "=" * 60, flush=True)
        print(f"[EMAIL FALLBACK] Could not send via SMTP: {error_str}", flush=True)
        print(f"TO: {to}", flush=True)
        print(f"SUBJECT: {subject}", flush=True)
        print(f"BODY:\n{text_body}", flush=True)
        print("=" * 60 + "\n", flush=True)

        if not fail_silently:
            raise self.retry(exc=exc, countdown=countdown)

