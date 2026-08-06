import logging
import requests
from celery import shared_task
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(requests.RequestException,),
    retry_backoff=True,
)
def process_esewa_refund_task(self, payment_id: int, amount: str | None = None):
    """
    Celery task to asynchronously process eSewa refunds with exponential backoff
    for transient network/server failures.
    """
    from celery.exceptions import MaxRetriesExceededError
    from apps.payments.models import Payment
    from apps.payments.services import initiate_esewa_refund
    from apps.common.email import send_email_to_staff

    try:
        payment = Payment.objects.get(id=payment_id)
        return initiate_esewa_refund(payment, amount=amount)
    except Payment.DoesNotExist:
        logger.error(f"Payment ID {payment_id} not found for refund task.")
        return None
    except ValidationError as e:
        # Non-transient business validation failure (explicit eSewa rejection, amount mismatch, etc.)
        # Mark failed and alert staff
        try:
            payment = Payment.objects.get(id=payment_id)
            payment.refund_status = Payment.RefundStatus.FAILED
            payment.save(update_fields=["refund_status", "updated_at"])
            send_email_to_staff(
                subject=f"[ADMIN ALERT] eSewa Refund Rejected for Payment #{payment.reference_id}",
                template_prefix="emails/admin_refund_failed",
                context={
                    "payment": payment,
                    "reason": str(e),
                },
            )
        except Exception:
            pass
        logger.error(f"Refund validation failed for Payment ID {payment_id}: {str(e)}")
        raise e
    except requests.RequestException as exc:
        # Check if retries are exhausted
        if self.request.retries >= self.max_retries:
            logger.error(
                f"eSewa refund task exhausted all {self.max_retries} retries for Payment ID {payment_id}: {exc}"
            )
            try:
                payment = Payment.objects.get(id=payment_id)
                payment.refund_status = Payment.RefundStatus.FAILED
                payment.save(update_fields=["refund_status", "updated_at"])
                send_email_to_staff(
                    subject=f"[ADMIN ALERT] eSewa Refund Exhausted Retries for Payment #{payment.reference_id}",
                    template_prefix="emails/admin_refund_failed",
                    context={
                        "payment": payment,
                        "reason": f"Transient network failure contacting eSewa after {self.max_retries} retries: {str(exc)}",
                    },
                )
            except Exception as notify_exc:
                logger.exception(f"Failed to dispatch admin notification for failed refund: {notify_exc}")
        raise exc
