from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from apps.events.models import Event, EventCategory
from apps.events.services import (
    create_category,
    create_event,
    submit_event_for_review,
    approve_event,
    publish_event,
    reject_event,
)
from apps.common.tests.factories import UserFactory, OrganizerProfileFactory


class EventServicesTest(TransactionTestCase):
    def setUp(self):
        self.admin = UserFactory(is_superuser=True, is_active=True)
        # Setup an approved organizer
        self.organizer_user = UserFactory(
            role="ORGANIZER", is_active=True, is_approved=True
        )
        self.organizer = OrganizerProfileFactory(user=self.organizer_user)

        # Unapproved organizer
        self.unapproved_user = UserFactory(
            role="ORGANIZER", is_active=False, is_approved=False
        )
        self.unapproved_organizer = OrganizerProfileFactory(user=self.unapproved_user)

    def test_create_category_generates_slug(self):
        cat = create_category(validated_data={"name": "Music Festival"})
        self.assertEqual(cat.slug, "music-festival")
        self.assertTrue(EventCategory.objects.filter(slug="music-festival").exists())

    def test_create_event_workflow(self):
        # 1. Create Event (DRAFT)
        start = timezone.now() + timezone.timedelta(days=10)
        end = start + timezone.timedelta(hours=4)

        self.category = create_category(validated_data={"name": "Music Festival"})

        event_data = {
            "title": "My Awesome Event",
            "short_description": "Short desc",
            "description": "Test description",
            "venue": "Test Venue",
            "address": "Test Address",
            "city": "Kathmandu",
            "capacity": 1000,
            "category": self.category,
            "start_datetime": start,
            "end_datetime": end,
            "ticket_tiers": [
                {
                    "name": "General Admission",
                    "price": "100.00",
                    "quantity": 50,
                    "is_active": True,
                }
            ],
        }

        event = create_event(organizer=self.organizer, validated_data=event_data)
        self.assertEqual(event.status, Event.Status.DRAFT)
        self.assertEqual(event.slug, "my-awesome-event")
        self.assertEqual(event.ticket_tiers.count(), 1)
        self.assertEqual(event.ticket_tiers.first().remaining_quantity, 50)

        # 2. Submit for review
        event = submit_event_for_review(event, organizer=self.organizer)
        self.assertEqual(event.status, Event.Status.SUBMITTED)

        # 3. Approve Event
        event = approve_event(event, admin=self.admin)
        self.assertEqual(event.status, Event.Status.APPROVED)

        # 4. Publish Event
        event = publish_event(event, admin=self.admin)
        self.assertEqual(event.status, Event.Status.PUBLISHED)

    def test_unapproved_organizer_cannot_submit_event(self):
        start = timezone.now() + timezone.timedelta(days=10)
        end = start + timezone.timedelta(hours=4)
        self.category = create_category(validated_data={"name": "Music Festival 2"})
        event_data = {
            "title": "Bad Event",
            "short_description": "Short desc",
            "description": "Test description",
            "venue": "Test Venue",
            "address": "Test Address",
            "city": "Kathmandu",
            "capacity": 1000,
            "category": self.category,
            "start_datetime": start,
            "end_datetime": end,
            "ticket_tiers": [{"name": "GA", "price": "100", "quantity": 10}],
        }
        event = create_event(
            organizer=self.unapproved_organizer, validated_data=event_data
        )

        with self.assertRaises(PermissionDenied) as ctx:
            submit_event_for_review(event, organizer=self.unapproved_organizer)
        self.assertIn("approved organizers", str(ctx.exception))

    def test_reject_event(self):
        start = timezone.now() + timezone.timedelta(days=10)
        end = start + timezone.timedelta(hours=4)
        self.category = create_category(validated_data={"name": "Music Festival 3"})
        event_data = {
            "title": "Rejected Event",
            "short_description": "Short desc",
            "description": "Test",
            "venue": "Test",
            "address": "Test",
            "city": "KTM",
            "capacity": 1000,
            "category": self.category,
            "start_datetime": start,
            "end_datetime": end,
            "ticket_tiers": [{"name": "GA", "price": "10", "quantity": 10}],
        }
        event = create_event(organizer=self.organizer, validated_data=event_data)
        submit_event_for_review(event, organizer=self.organizer)

        reject_event(event, admin=self.admin, reason="Needs more details.")
        self.assertEqual(event.status, Event.Status.REJECTED)
        self.assertEqual(event.rejection_reason, "Needs more details.")

    def test_auto_archive_ended_events(self):
        from apps.events.services import auto_archive_ended_events

        category = create_category(validated_data={"name": "Past Category"})
        past_start = timezone.now() - timezone.timedelta(days=2)
        past_end = timezone.now() - timezone.timedelta(days=1)

        event_data = {
            "title": "Past Event",
            "short_description": "Ended event",
            "description": "Desc",
            "venue": "Venue",
            "address": "Address",
            "city": "Pokhara",
            "capacity": 500,
            "category": category,
            "start_datetime": past_start,
            "end_datetime": past_end,
            "ticket_tiers": [{"name": "Standard", "price": "50", "quantity": 100}],
        }
        event = create_event(organizer=self.organizer, validated_data=event_data)
        event.status = Event.Status.PUBLISHED
        event.save()

        count = auto_archive_ended_events()
        self.assertEqual(count, 1)

        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.ARCHIVED)

