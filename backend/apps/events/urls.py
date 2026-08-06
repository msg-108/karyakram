from django.urls import path

from .views import (
    AdminEventApprovalView,
    AdminEventPublishView,
    AdminPendingEventListView,
    OrganizerEventDetailView,
    OrganizerEventImageListCreateView,
    OrganizerEventListCreateView,
    OrganizerEventSubmitView,
    OrganizerTicketTierDetailView,
    OrganizerTicketTierListCreateView,
    PublicCategoryListView,
    PublicEventDetailView,
    PublicEventListView,
)

# Rule: raw resource CRUD lives here under public, organizer/, and admin/ sub-paths.
# api/dashboard/ is reserved for aggregate/summary data only — not raw resource lists.

app_name = "events"

# Public and organizer patterns — mounted at api/events/ in config/urls.py.
urlpatterns = [
    # Public: event browsing
    path("", PublicEventListView.as_view(), name="public-event-list"),
    path("<slug:slug>/", PublicEventDetailView.as_view(), name="public-event-detail"),
    path("categories/", PublicCategoryListView.as_view(), name="public-category-list"),

    # Organizer: event CRUD
    path("organizer/", OrganizerEventListCreateView.as_view(), name="organizer-event-list-create"),
    path("organizer/<int:pk>/", OrganizerEventDetailView.as_view(), name="organizer-event-detail"),
    path("organizer/<int:pk>/submit/", OrganizerEventSubmitView.as_view(), name="organizer-event-submit"),

    # Organizer: ticket tiers (fully nested — tier only makes sense under its event)
    path("organizer/<int:pk>/tiers/", OrganizerTicketTierListCreateView.as_view(), name="organizer-event-tier-list-create"),
    path("organizer/<int:event_id>/tiers/<int:tier_id>/", OrganizerTicketTierDetailView.as_view(), name="organizer-ticket-tier-detail"),

    # Organizer: gallery images
    path("organizer/<int:pk>/images/", OrganizerEventImageListCreateView.as_view(), name="organizer-event-image-list-create"),
]

# Admin-only patterns — mounted separately at api/admin/events/ in config/urls.py
# so all admin surfaces live under a single discoverable api/admin/ namespace.
admin_urlpatterns = [
    path("pending/", AdminPendingEventListView.as_view(), name="admin-event-pending"),
    path("<int:pk>/approve/", AdminEventApprovalView.as_view(), name="admin-event-approve"),
    path("<int:pk>/publish/", AdminEventPublishView.as_view(), name="admin-event-publish"),
]