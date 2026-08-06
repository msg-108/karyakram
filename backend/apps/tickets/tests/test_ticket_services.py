import jwt
from django.conf import settings
from django.test import TransactionTestCase
from rest_framework.exceptions import ValidationError
from apps.tickets.models import Ticket
from apps.tickets.services import generate_tickets_for_booking, check_in_ticket
from apps.bookings.models import Booking
from apps.bookings.services import create_booking
from apps.common.tests.factories import UserFactory, EventFactory, TicketTierFactory


class TicketServicesTest(TransactionTestCase):
    def setUp(self):
        self.user = UserFactory()
        self.event = EventFactory()
        self.tier = TicketTierFactory(
            event=self.event, quantity=10, remaining_quantity=10, price=100
        )

        # We need a confirmed booking to generate tickets
        booking = create_booking(
            user=self.user,
            event=self.event,
            items=[{"ticket_tier_id": self.tier.id, "quantity": 2}],
        )

        # Bypass confirm_booking() to avoid double-generating tickets if that's what it does,
        # or just set it manually so we can explicitly test generate_tickets_for_booking
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        self.booking = booking

    def test_generate_tickets_for_booking(self):
        generate_tickets_for_booking(self.booking)

        self.assertEqual(self.booking.tickets.count(), 2)
        ticket = self.booking.tickets.first()

        self.assertEqual(ticket.status, Ticket.Status.VALID)
        self.assertTrue(ticket.qr_code_payload)

        # Verify JWT structure
        decoded = jwt.decode(
            ticket.qr_code_payload, settings.SECRET_KEY, algorithms=["HS256"]
        )
        self.assertEqual(decoded["ticket_id"], str(ticket.id))
        self.assertEqual(decoded["event_id"], self.event.id)

    def test_check_in_ticket_success(self):
        generate_tickets_for_booking(self.booking)
        ticket = self.booking.tickets.first()

        checked_in_ticket = check_in_ticket(ticket.qr_code_payload, self.event.id)

        self.assertEqual(checked_in_ticket.id, ticket.id)
        self.assertEqual(checked_in_ticket.status, Ticket.Status.CHECKED_IN)
        self.assertIsNotNone(checked_in_ticket.checked_in_at)

    def test_check_in_fails_for_wrong_event(self):
        generate_tickets_for_booking(self.booking)
        ticket = self.booking.tickets.first()

        other_event = EventFactory()

        with self.assertRaises(ValidationError) as context:
            check_in_ticket(ticket.qr_code_payload, other_event.id)

        self.assertIn("Ticket is not valid for this event.", str(context.exception))

    def test_check_in_fails_for_already_checked_in(self):
        generate_tickets_for_booking(self.booking)
        ticket = self.booking.tickets.first()
        check_in_ticket(ticket.qr_code_payload, self.event.id)

        with self.assertRaises(ValidationError) as context:
            check_in_ticket(ticket.qr_code_payload, self.event.id)

        self.assertIn("already been checked in", str(context.exception))

    def test_check_in_fails_for_invalid_signature(self):
        generate_tickets_for_booking(self.booking)
        ticket = self.booking.tickets.first()

        # Forge a token with wrong secret
        forged_payload = jwt.encode(
            {"ticket_id": str(ticket.id), "event_id": self.event.id},
            "wrong_secret",
            algorithm="HS256",
        )

        with self.assertRaises(ValidationError) as context:
            check_in_ticket(forged_payload, self.event.id)

        self.assertIn("Invalid or corrupted ticket QR code.", str(context.exception))
