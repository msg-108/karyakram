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

        # Verify JWT signed with NEW dedicated key
        decoded = jwt.decode(
            ticket.qr_code_payload, settings.QR_JWT_SECRET_KEY, algorithms=["HS256"]
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

    def test_check_in_legacy_signed_ticket_fallback(self):
        generate_tickets_for_booking(self.booking)
        ticket = self.booking.tickets.first()

        # Sign ticket using OLD key (settings.SECRET_KEY)
        legacy_payload = jwt.encode(
            {
                "ticket_id": str(ticket.id),
                "booking_id": ticket.booking_id,
                "event_id": ticket.booking.event_id,
                "attendee_email": ticket.attendee_email,
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )

        checked_in_ticket = check_in_ticket(legacy_payload, self.event.id)
        self.assertEqual(checked_in_ticket.id, ticket.id)
        self.assertEqual(checked_in_ticket.status, Ticket.Status.CHECKED_IN)

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
            "completely_wrong_secret",
            algorithm="HS256",
        )

        with self.assertRaises(ValidationError) as context:
            check_in_ticket(forged_payload, self.event.id)

        self.assertIn("Invalid or corrupted ticket QR code.", str(context.exception))

    def test_check_legacy_tickets_management_command(self):
        from io import StringIO
        from django.core.management import call_command
        from django.utils import timezone
        from dateutil.parser import parse as parse_date

        rollout_date_str = getattr(settings, "QR_KEY_ROLLOUT_DATE", "2026-08-06T00:00:00Z")
        rollout_date = parse_date(rollout_date_str)
        if timezone.is_naive(rollout_date):
            rollout_date = timezone.make_aware(rollout_date)

        # 1. Create a future event and legacy ticket (created BEFORE rollout)
        future_event = EventFactory(start_datetime=timezone.now() + timezone.timedelta(days=10))
        tier_future = TicketTierFactory(event=future_event)
        booking_future = create_booking(
            user=self.user,
            event=future_event,
            items=[{"ticket_tier_id": tier_future.id, "quantity": 1}],
        )
        booking_future.status = Booking.Status.CONFIRMED
        booking_future.save()
        tickets_future = generate_tickets_for_booking(booking_future)
        legacy_ticket = tickets_future[0]

        # Force created_at to before rollout date
        legacy_ticket.created_at = rollout_date - timezone.timedelta(days=1)
        legacy_ticket.save(update_fields=["created_at"])

        # Run command — should report 1 legacy ticket remaining and Safe to retire: NO
        out = StringIO()
        call_command("check_legacy_tickets", stdout=out)
        output = out.getvalue()
        self.assertIn("Legacy tickets remaining: 1", output)
        self.assertIn("Safe to retire legacy key fallback: NO", output)

        # 2. Check-in the legacy ticket
        legacy_ticket.status = Ticket.Status.CHECKED_IN
        legacy_ticket.save(update_fields=["status"])

        # Run command again — should report 0 legacy tickets remaining and Safe to retire: YES
        out = StringIO()
        call_command("check_legacy_tickets", stdout=out)
        output = out.getvalue()
        self.assertIn("Legacy tickets remaining: 0", output)
        self.assertIn("Safe to retire legacy key fallback: YES", output)
