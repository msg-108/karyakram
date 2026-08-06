from unittest.mock import patch
from django.test import TransactionTestCase, override_settings
from apps.payments.models import Payment
from apps.payments.services import (
    create_payment,
    get_esewa_payment_data,
    verify_esewa_payment,
)
from apps.bookings.services import create_booking
from apps.common.tests.factories import UserFactory, EventFactory, TicketTierFactory


@override_settings(FRONTEND_URL="http://localhost:3000")
class PaymentServicesTest(TransactionTestCase):
    def setUp(self):
        self.user = UserFactory()
        self.event = EventFactory()
        self.tier = TicketTierFactory(
            event=self.event, quantity=10, remaining_quantity=10, price=100
        )
        self.booking = create_booking(
            user=self.user,
            event=self.event,
            items=[{"ticket_tier_id": self.tier.id, "quantity": 1}],
        )

    def test_create_payment(self):
        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)

        self.assertEqual(payment.provider, Payment.Provider.ESEWA)
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(payment.amount, self.booking.total_amount)
        self.assertIsNotNone(payment.reference_id)

    def test_get_esewa_payment_data(self):
        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)
        data = get_esewa_payment_data(payment)

        self.assertEqual(data["amount"], "100.00")
        self.assertIn("signature", data)
        self.assertEqual(data["transaction_uuid"], str(payment.reference_id))


    @patch("apps.payments.services.requests.get")
    def test_verify_esewa_payment_success(self, mock_get):
        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)

        mock_response = mock_get.return_value
        mock_response.json.return_value = {
            "status": "COMPLETE",
            "refId": "esewa-tx-123",
        }

        verified_payment = verify_esewa_payment(payment)
        self.assertEqual(verified_payment.status, Payment.Status.COMPLETED)
        self.assertEqual(verified_payment.transaction_id, "esewa-tx-123")

    @patch("apps.payments.services.requests.post")
    def test_initiate_esewa_refund_success(self, mock_post):
        from apps.payments.services import initiate_esewa_refund, create_payment

        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)
        payment.status = Payment.Status.COMPLETED
        payment.transaction_id = "esewa-tx-123"
        payment.save()

        mock_response = mock_post.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "COMPLETE"}

        refunded_payment = initiate_esewa_refund(payment, amount=100.00)
        self.assertEqual(refunded_payment.status, Payment.Status.REFUNDED)
        self.assertEqual(refunded_payment.refund_status, Payment.RefundStatus.SUCCESS)
        mock_post.assert_called_once()

    @patch("apps.payments.services.requests.post")
    def test_initiate_esewa_refund_duplicate_request(self, mock_post):
        from apps.payments.services import initiate_esewa_refund, create_payment

        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)
        payment.status = Payment.Status.REFUNDED
        payment.refund_status = Payment.RefundStatus.SUCCESS
        payment.transaction_id = "esewa-tx-123"
        payment.save()

        # Should return existing record without calling HTTP API
        refunded_payment = initiate_esewa_refund(payment)
        self.assertEqual(refunded_payment.status, Payment.Status.REFUNDED)
        mock_post.assert_not_called()

    @patch("apps.payments.services.requests.post")
    def test_initiate_esewa_refund_transient_failure(self, mock_post):
        import requests
        from apps.payments.services import initiate_esewa_refund, create_payment

        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)
        payment.status = Payment.Status.COMPLETED
        payment.transaction_id = "esewa-tx-123"
        payment.save()

        mock_post.side_effect = requests.RequestException("Network error")

        with self.assertRaises(requests.RequestException):
            initiate_esewa_refund(payment)

    @patch("apps.payments.services.requests.post")
    def test_initiate_esewa_refund_amount_mismatch(self, mock_post):
        from rest_framework.exceptions import ValidationError
        from apps.payments.services import initiate_esewa_refund, create_payment

        payment = create_payment(booking=self.booking, provider=Payment.Provider.ESEWA)
        payment.status = Payment.Status.COMPLETED
        payment.transaction_id = "esewa-tx-123"
        payment.save()

        with self.assertRaises(ValidationError) as ctx:
            initiate_esewa_refund(payment, amount=50.00)

        self.assertIn("does not match", str(ctx.exception))
        mock_post.assert_not_called()

