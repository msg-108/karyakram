"""
URL configuration for the Karyakram project.

Mount conventions:
  api/               — auth, profile (apps.users)
  api/me/            — authenticated user's own raw resources (tickets, payments, events)
  api/events/        — public event browsing + organizer CRUD
  api/admin/         — unified admin namespace (organizers, events)
  api/bookings/      — booking CRUD + booking-scoped payment actions
  api/payments/      — standalone payment resource (future: GET /payments/<ref_id>/)
  api/dashboard/     — aggregate/summary data (counts, analytics, feeds)
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.conf import settings
from django.conf.urls.static import static

from apps.events.urls import admin_urlpatterns as events_admin_urlpatterns

urlpatterns = [
    # Django admin site
    path("admin/", admin.site.urls),
    # Auth, profile, and admin-organizer actions (users app)
    path("api/", include("apps.users.urls")),
    # Authenticated user's own raw resources
    path("api/me/", include("apps.dashboard.me_urls")),
    # Public event browsing + organizer CRUD
    path("api/events/", include("apps.events.urls")),
    # Unified admin namespace
    path("api/admin/events/", include((events_admin_urlpatterns, "events-admin"))),
    # Booking CRUD
    path("api/bookings/", include("apps.bookings.urls")),
    # Booking-scoped payment actions (initiate / verify)
    path("api/bookings/", include("apps.payments.urls")),
    # Standalone payment resource (receipt, status, reconciliation)
    path("api/payments/", include("apps.payments.standalone_urls")),
    # Ticket operations (me/tickets/ list + events/<id>/check-in/)
    path("api/", include("apps.tickets.urls")),
    # Aggregate/summary dashboard data
    path("api/dashboard/", include("apps.dashboard.urls")),
    # OpenAPI schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
