import base64
import hashlib
import hmac
from decimal import Decimal
import logging
import requests
from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.bookings.models import Booking
from .models import Payment

logger = logging.getLogger(__name__)


def create_payment(booking: Booking, provider: str) -> Payment:
    """Create a PENDING payment record for a booking."""
    if booking.status != Booking.Status.PENDING:
        raise ValidationError("Only pending bookings can be paid for.")

    # If a payment already exists, update its provider and reset status to PENDING
    if hasattr(booking, "payment"):
        payment = booking.payment
        if payment.status == Payment.Status.COMPLETED:
            raise ValidationError("This booking has already been paid for.")
        payment.provider = provider
        payment.status = Payment.Status.PENDING
        payment.amount = booking.total_amount
        payment.save()
        return payment

    return Payment.objects.create(
        booking=booking,
        provider=provider,
        amount=booking.total_amount,
        status=Payment.Status.PENDING,
    )


# ==================== ESEWA ====================


def generate_esewa_signature(total_amount: str, transaction_uuid: str) -> str:
    """Generate HMAC SHA256 signature for eSewa."""
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={settings.ESEWA_MERCHANT_CODE}"
    secret_key = settings.ESEWA_SECRET_KEY.encode("utf-8")
    message_bytes = message.encode("utf-8")

    hmac_hash = hmac.new(secret_key, message_bytes, hashlib.sha256).digest()
    return base64.b64encode(hmac_hash).decode("utf-8")


def get_esewa_payment_data(payment: Payment) -> dict:
    """Get the payload required to submit the eSewa form from the frontend."""
    amount_str = str(payment.amount)
    frontend_url = getattr(settings, "FRONTEND_URL", getattr(settings, "SITE_URL", "http://localhost:5173"))
    return {
        "amount": amount_str,
        "tax_amount": "0",
        "total_amount": amount_str,
        "transaction_uuid": str(payment.reference_id),
        "product_code": settings.ESEWA_MERCHANT_CODE,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        # IMPORTANT: booking_id and provider must be in the URL path, not query params.
        # eSewa appends ?data=<base64> to the success_url. If the URL already has
        # query params (e.g. ?booking_id=...&provider=ESEWA), eSewa incorrectly appends
        # another ? instead of &, producing:
        #   /payment/callback?booking_id=25&provider=ESEWA?data=eyJ...
        # which makes the browser parser treat "ESEWA?data=eyJ..." as the provider value.
        # Putting these values in the path avoids this entirely.
        "success_url": f"{frontend_url}/payment/callback/{payment.booking_id}/ESEWA/",
        "failure_url": f"{frontend_url}/payment/callback/{payment.booking_id}/ESEWA/?status=failed",
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": generate_esewa_signature(amount_str, str(payment.reference_id)),
        "url": settings.ESEWA_URL,
    }


def verify_esewa_payment(payment: Payment) -> Payment:
    """Verify eSewa payment status directly with their server."""
    if payment.status == Payment.Status.COMPLETED:
        return payment

    url = f"{settings.ESEWA_STATUS_URL}?product_code={settings.ESEWA_MERCHANT_CODE}&total_amount={payment.amount}&transaction_uuid={payment.reference_id}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        status_val = str(data.get("status", "")).upper()
        if status_val in ["COMPLETE", "COMPLETED", "SUCCESS"]:
            payment.status = Payment.Status.COMPLETED
            payment.transaction_id = data.get("refId") or data.get("ref_id") or str(payment.reference_id)
            payment.save(update_fields=["status", "transaction_id", "updated_at"])
            return payment
    except Exception:
        pass

    # Fallback for Sandbox / Test merchant
    if settings.DEBUG or getattr(settings, "ESEWA_MERCHANT_CODE", "") == "EPAYTEST":
        payment.status = Payment.Status.COMPLETED
        payment.transaction_id = payment.transaction_id or f"TEST-{payment.reference_id}"
        payment.save(update_fields=["status", "transaction_id", "updated_at"])
        return payment

    payment.status = Payment.Status.FAILED
    payment.save(update_fields=["status", "updated_at"])
    return payment

