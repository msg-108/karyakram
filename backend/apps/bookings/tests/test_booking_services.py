from django.test import TransactionTestCase
from unittest.mock import patch
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.bookings.models import Booking
from apps.bookings.services import create_booking, confirm_booking
from apps.bookings.management.commands.cancel_expired_bookings import (
    Command as CancelExpiredCommand,
)
from apps.common.tests.factories import UserFactory, EventFactory, TicketTierFactory


class BookingServicesTest(TransactionTestCase):
    def test_create_booking_reserves_inventory(self):
        user = UserFactory()
        event = EventFactory()
        tier = TicketTierFactory(
            event=event, quantity=10, remaining_quantity=10, price=100
        )

        # 1. Create a booking for 2 tickets
        tier_data = [{"ticket_tier_id": tier.id, "quantity": 2}]
        booking = create_booking(user=user, event=event, items=tier_data)

        # 2. Check booking attributes
        self.assertEqual(booking.status, Booking.Status.PENDING)
        self.assertEqual(booking.total_amount, 200)
        self.assertIsNotNone(booking.hold_expires_at)
        self.assertTrue(booking.hold_expires_at > timezone.now())

        # 3. Check inventory was deducted
        tier.refresh_from_db()
        self.assertEqual(tier.remaining_quantity, 8)

    def test_create_booking_fails_if_not_enough_inventory(self):
        user = UserFactory()
        event = EventFactory()
        tier = TicketTierFactory(event=event, quantity=10, remaining_quantity=2)

        tier_data = [{"ticket_tier_id": tier.id, "quantity": 5}]

        with self.assertRaises(ValidationError) as context:
            create_booking(user=user, event=event, items=tier_data)

        self.assertIn("Only 2", str(context.exception))

    def test_confirm_booking_transitions_state_and_generates_tickets(self):
        user = UserFactory()
        event = EventFactory()
        tier = TicketTierFactory(event=event)
        booking = create_booking(
            user=user, event=event, items=[{"ticket_tier_id": tier.id, "quantity": 1}]
        )

        self.assertEqual(booking.status, Booking.Status.PENDING)

        confirmed_booking = confirm_booking(booking)

        self.assertEqual(confirmed_booking.status, Booking.Status.CONFIRMED)
        self.assertIsNone(confirmed_booking.hold_expires_at)

        # Check tickets were generated
        self.assertEqual(confirmed_booking.tickets.count(), 1)

    def test_cancel_expired_bookings_restores_inventory(self):
        user = UserFactory()
        event = EventFactory()
        tier = TicketTierFactory(event=event, quantity=10, remaining_quantity=10)

        booking = create_booking(
            user=user, event=event, items=[{"ticket_tier_id": tier.id, "quantity": 3}]
        )

        tier.refresh_from_db()
        self.assertEqual(tier.remaining_quantity, 7)

        # Fast forward expiration
        booking.hold_expires_at = timezone.now() - timezone.timedelta(minutes=1)
        booking.save()

        # Run the sweeping command
        cmd = CancelExpiredCommand()
        cmd.handle()

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.EXPIRED)

        # Inventory restored
        tier.refresh_from_db()
        self.assertEqual(tier.remaining_quantity, 10)

    @patch("apps.bookings.tasks.verify_esewa_payment")
    def test_cancel_expired_bookings_reconciles_esewa_payment(self, mock_verify):
        from apps.payments.models import Payment
        from apps.payments.services import create_payment
        
        user = UserFactory()
        event = EventFactory()
        tier = TicketTierFactory(event=event, quantity=10, remaining_quantity=10)

        booking = create_booking(
            user=user, event=event, items=[{"ticket_tier_id": tier.id, "quantity": 1}]
        )
        # Attach a pending eSewa payment
        payment = create_payment(booking, Payment.Provider.ESEWA)

        # Fast forward expiration
        booking.hold_expires_at = timezone.now() - timezone.timedelta(minutes=1)
        booking.save()

        # Mock that eSewa actually completed this payment
        mock_verify.return_value.status = Payment.Status.COMPLETED

        cmd = CancelExpiredCommand()
        cmd.handle()

        booking.refresh_from_db()
        # Booking should NOT be expired, it should be CONFIRMED!
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.tickets.count(), 1)
        
        # Payment verification should have been called
        mock_verify.assert_called_once()
