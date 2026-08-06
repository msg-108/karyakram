from django.urls import path

from .views import (
    PaymentHistoryView,
    TicketReceiptDownloadView,
    UpcomingEventsView,
    UpcomingTicketsView,
)

# Mounted at api/me/ in config/urls.py.
#
# Rule: api/me/ hosts the authenticated user's own raw resources (collections and
# individual-resource actions).  api/dashboard/ is reserved for aggregate/summary
# data (counts, analytics, feeds) — not raw resource lists.
#
# These views live in apps.dashboard.views because they share dashboard services.
# Their URL home is api/me/ because they serve per-user resource data, not aggregates.

urlpatterns = [
    # Tickets
    path(
        "tickets/upcoming/", UpcomingTicketsView.as_view(), name="my-tickets-upcoming"
    ),
    path(
        "tickets/<uuid:ticket_id>/receipt/",
        TicketReceiptDownloadView.as_view(),
        name="my-ticket-receipt",
    ),
    # Payments
    path("payments/", PaymentHistoryView.as_view(), name="my-payments"),
    # Events
    path("events/upcoming/", UpcomingEventsView.as_view(), name="my-events-upcoming"),
]
