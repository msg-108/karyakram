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

app_name = "events"

urlpatterns = [
    # Public
    path("events/", PublicEventListView.as_view(), name="public-event-list"),
    path("events/<slug:slug>/", PublicEventDetailView.as_view(), name="public-event-detail"),
    path("categories/", PublicCategoryListView.as_view(), name="public-category-list"),
    # Organizer: events
    path("organizer/events/", OrganizerEventListCreateView.as_view(), name="organizer-event-list-create"),
    path("organizer/events/<int:pk>/", OrganizerEventDetailView.as_view(), name="organizer-event-detail"),
    path(
        "organizer/events/<int:pk>/submit/",
        OrganizerEventSubmitView.as_view(),
        name="organizer-event-submit",
    ),
    # Organizer: ticket tiers
    path(
        "organizer/events/<int:pk>/tiers/",
        OrganizerTicketTierListCreateView.as_view(),
        name="organizer-event-tier-list-create",
    ),
    path(
        "organizer/ticket-tiers/<int:pk>/",
        OrganizerTicketTierDetailView.as_view(),
        name="organizer-ticket-tier-detail",
    ),
    # Organizer: gallery images
    path(
        "organizer/events/<int:pk>/images/",
        OrganizerEventImageListCreateView.as_view(),
        name="organizer-event-image-list-create",
    ),
    # Admin
    path("admin/events/pending/", AdminPendingEventListView.as_view(), name="admin-event-pending"),
    path(
        "admin/events/<int:pk>/approve/",
        AdminEventApprovalView.as_view(),
        name="admin-event-approve",
    ),
    path(
        "admin/events/<int:pk>/publish/",
        AdminEventPublishView.as_view(),
        name="admin-event-publish",
    ),
]