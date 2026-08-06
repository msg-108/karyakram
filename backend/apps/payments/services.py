import base64
import hashlib
import hmac
import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError

from apps.bookings.models import Booking
from .models import Payment


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
    return {
        "amount": amount_str,
        "tax_amount": "0",
        "total_amount": amount_str,
        "transaction_uuid": str(payment.reference_id),
        "product_code": settings.ESEWA_MERCHANT_CODE,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "success_url": f"{settings.FRONTEND_URL}/payment/esewa/success",
        "failure_url": f"{settings.FRONTEND_URL}/payment/esewa/failure",
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
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "COMPLETE":
            payment.status = Payment.Status.COMPLETED
            payment.transaction_id = data.get("refId", "")
            payment.save(update_fields=["status", "transaction_id", "updated_at"])
        else:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
    except requests.RequestException:
        raise ValidationError("Failed to verify payment with eSewa.")

    return payment


def initiate_esewa_refund(payment: Payment) -> Payment:
    """
    Initiate a refund for a COMPLETED eSewa payment.
    Note: eSewa automated refund API may require merchant portal configuration.
    This simulates the refund request and updates the payment status.
    """
    if payment.status != Payment.Status.COMPLETED:
        raise ValidationError("Only completed payments can be refunded.")

    # Stub for actual eSewa Refund API call
    # url = f"{settings.ESEWA_URL}/refund" (depends on merchant documentation)
    # Payload would typically include transaction_id and amount

    # Simulating successful refund
    payment.status = Payment.Status.REFUNDED
    payment.save(update_fields=["status", "updated_at"])
    return payment
