from dateutil.parser import parse as parse_date
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.tickets.models import Ticket


class Command(BaseCommand):
    help = "Deterministically counts un-checked legacy tickets for future events to determine if fallback key retirement is safe."

    def handle(self, *args, **options):
        rollout_date_str = getattr(settings, "QR_KEY_ROLLOUT_DATE", "2026-08-06T00:00:00Z")
        try:
            rollout_date = parse_date(rollout_date_str)
            if timezone.is_naive(rollout_date):
                rollout_date = timezone.make_aware(rollout_date)
        except Exception:
            rollout_date = timezone.now()

        legacy_tickets_count = Ticket.objects.filter(
            created_at__lt=rollout_date,
            booking__event__start_datetime__gt=timezone.now(),
            status=Ticket.Status.VALID,
        ).count()

        if legacy_tickets_count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "Legacy tickets remaining: 0. Safe to retire legacy key fallback: YES"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Legacy tickets remaining: {legacy_tickets_count}. Safe to retire legacy key fallback: NO"
                )
            )
