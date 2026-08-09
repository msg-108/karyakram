import factory
from django.utils import timezone
from apps.users.models import User, OrganizerProfile
from apps.events.models import Event, TicketTier, EventCategory


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    is_active = True
    is_approved = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password("password123")


class OrganizerProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrganizerProfile

    user = factory.SubFactory(UserFactory)
    organization_name = factory.Sequence(lambda n: f"Org {n}")


class EventCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EventCategory

    name = factory.Sequence(lambda n: f"Category {n}")


class EventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Event

    organizer = factory.SubFactory(OrganizerProfileFactory)
    category = factory.SubFactory(EventCategoryFactory)
    title = factory.Sequence(lambda n: f"Event {n}")
    slug = factory.Sequence(lambda n: f"event-{n}")
    description = "Test Event Description"
    venue = "Test Venue"
    address = "Test Address"
    city = "Kathmandu"
    status = Event.Status.PUBLISHED
    start_datetime = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(days=7)
    )
    end_datetime = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(days=7, hours=2)
    )
    capacity = 100


class TicketTierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TicketTier

    event = factory.SubFactory(EventFactory)
    name = factory.Sequence(lambda n: f"Tier {n}")
    price = 100.00
    quantity = 100
    remaining_quantity = 100
    is_active = True
