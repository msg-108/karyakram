from django.urls import path

from .views import (
    CheckInStatisticsView,
    EventAttendeeListView,
    EventStatisticsView,
    NotificationListView,
    OrganizerDashboardSummaryView,
    OrganizerEventListView,
    OrganizerUpcomingEventListView,
    QRScanStatisticsView,
    RecentActivityView,
    RecentOrdersView,
    ReportExportView,
    RevenueAnalyticsView,
    TicketSalesSummaryView,
    UserDashboardSummaryView,
)

# Mounted at api/dashboard/ in config/urls.py.
#
# Rule: dashboard/ hosts aggregate/summary data only (counts, analytics, feeds).
# Raw resource lists (tickets, payments, events) belong under the resource's own
# path — either api/events/, api/bookings/, or api/me/ for user-owned resources.
# See apps/dashboard/me_urls.py for the me/ routes that were previously here.

app_name = "dashboard"

urlpatterns = [
    # User dashboard: profile summary (aggregate counts card)
    path("user/summary/", UserDashboardSummaryView.as_view(), name="user-summary"),

    # User dashboard: activity feed (aggregate)
    path("user/activity/", RecentActivityView.as_view(), name="user-activity"),

    # Notifications (shared, role-agnostic aggregate feed)
    path("notifications/", NotificationListView.as_view(), name="notifications"),

    # Organizer dashboard: profile summary (aggregate counts card)
    path("organizer/summary/", OrganizerDashboardSummaryView.as_view(), name="organizer-summary"),

    # Organizer dashboard: event list for dashboard card
    path("organizer/events/", OrganizerEventListView.as_view(), name="organizer-events"),
    path("organizer/events/upcoming/", OrganizerUpcomingEventListView.as_view(), name="organizer-events-upcoming"),
    path("organizer/events/<int:event_id>/attendees/", EventAttendeeListView.as_view(), name="organizer-event-attendees"),

    # Organizer dashboard: statistics & analytics
    path("organizer/statistics/events/", EventStatisticsView.as_view(), name="organizer-statistics-events"),
    path("organizer/statistics/revenue/", RevenueAnalyticsView.as_view(), name="organizer-statistics-revenue"),
    path("organizer/statistics/tickets/", TicketSalesSummaryView.as_view(), name="organizer-statistics-tickets"),
    path("organizer/statistics/checkins/", CheckInStatisticsView.as_view(), name="organizer-statistics-checkins"),
    path("organizer/statistics/qr-scans/", QRScanStatisticsView.as_view(), name="organizer-statistics-qr-scans"),

    # Organizer dashboard: orders
    path("organizer/orders/recent/", RecentOrdersView.as_view(), name="organizer-orders-recent"),

    # Organizer dashboard: exports
    path("organizer/reports/<str:report_type>/export/", ReportExportView.as_view(), name="organizer-report-export"),
]