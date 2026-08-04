from django.urls import path

from .views import (
    CheckInStatisticsView,
    EventAttendeeListView,
    EventStatisticsView,
    NotificationListView,
    OrganizerDashboardSummaryView,
    OrganizerEventListView,
    OrganizerUpcomingEventListView,
    PaymentHistoryView,
    QRScanStatisticsView,
    RecentActivityView,
    RecentOrdersView,
    ReportExportView,
    RevenueAnalyticsView,
    TicketHistoryView,
    TicketReceiptDownloadView,
    TicketSalesSummaryView,
    UpcomingEventsView,
    UpcomingTicketsView,
    UserDashboardSummaryView,
)

app_name = "dashboard"

urlpatterns = [
    # User dashboard: profile summary
    path("user/summary/", UserDashboardSummaryView.as_view(), name="user-summary"),
    # User dashboard: tickets
    path("user/tickets/upcoming/", UpcomingTicketsView.as_view(), name="user-tickets-upcoming"),
    path("user/tickets/history/", TicketHistoryView.as_view(), name="user-tickets-history"),
    path(
        "user/tickets/<uuid:ticket_id>/receipt/",
        TicketReceiptDownloadView.as_view(),
        name="user-ticket-receipt",
    ),
    # User dashboard: payments
    path("user/payments/", PaymentHistoryView.as_view(), name="user-payments"),
    # User dashboard: events & activity
    path("user/events/upcoming/", UpcomingEventsView.as_view(), name="user-events-upcoming"),
    path("user/activity/", RecentActivityView.as_view(), name="user-activity"),
    # Notifications (shared, role-agnostic)
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    # Organizer dashboard: profile summary
    path("organizer/summary/", OrganizerDashboardSummaryView.as_view(), name="organizer-summary"),
    # Organizer dashboard: events
    path("organizer/events/", OrganizerEventListView.as_view(), name="organizer-events"),
    path(
        "organizer/events/upcoming/",
        OrganizerUpcomingEventListView.as_view(),
        name="organizer-events-upcoming",
    ),
    path(
        "organizer/events/<int:event_id>/attendees/",
        EventAttendeeListView.as_view(),
        name="organizer-event-attendees",
    ),
    # Organizer dashboard: statistics & analytics
    path(
        "organizer/statistics/events/",
        EventStatisticsView.as_view(),
        name="organizer-statistics-events",
    ),
    path(
        "organizer/statistics/revenue/",
        RevenueAnalyticsView.as_view(),
        name="organizer-statistics-revenue",
    ),
    path(
        "organizer/statistics/tickets/",
        TicketSalesSummaryView.as_view(),
        name="organizer-statistics-tickets",
    ),
    path(
        "organizer/statistics/checkins/",
        CheckInStatisticsView.as_view(),
        name="organizer-statistics-checkins",
    ),
    path(
        "organizer/statistics/qr-scans/",
        QRScanStatisticsView.as_view(),
        name="organizer-statistics-qr-scans",
    ),
    # Organizer dashboard: orders
    path("organizer/orders/recent/", RecentOrdersView.as_view(), name="organizer-orders-recent"),
    # Organizer dashboard: exports (future-ready)
    path(
        "organizer/reports/<str:report_type>/export/",
        ReportExportView.as_view(),
        name="organizer-report-export",
    ),
]