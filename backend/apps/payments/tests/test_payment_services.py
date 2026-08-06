from unittest.mock import patch
from django.test import TransactionTestCase, override_settings
from apps.payments.models import Payment
from apps.payments.services import (
    create_payment,
    get_esewa_payment_data,
    initiate_khalti_payment,
    verify_esewa_payment,
    verify_khalti_payment,
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

    @patch("apps.payments.services.requests.post")
    def test_initiate_khalti_payment(self, mock_post):
        payment = create_payment(booking=self.booking, provider=Payment.Provider.KHALTI)

        mock_response = mock_post.return_value
        mock_response.json.return_value = {
            "payment_url": "https://khalti.com/pay/123",
            "pidx": "test-pidx-123",
        }

        result = initiate_khalti_payment(payment)

        self.assertEqual(result["payment_url"], "https://khalti.com/pay/123")
        payment.refresh_from_db()
        self.assertEqual(payment.transaction_id, "test-pidx-123")

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
    def test_verify_khalti_payment_success(self, mock_post):
        payment = create_payment(booking=self.booking, provider=Payment.Provider.KHALTI)

        mock_response = mock_post.return_value
        mock_response.json.return_value = {"status": "Completed"}

        verified_payment = verify_khalti_payment(payment, "test-pidx-123")
        self.assertEqual(verified_payment.status, Payment.Status.COMPLETED)
