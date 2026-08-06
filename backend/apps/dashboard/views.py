"""
Thin API views. Every view delegates to `services` for anything beyond
request parsing / permission checks / response shaping.
"""
from __future__ import annotations

from django.http import HttpResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from apps.common.permissions import IsOrganizer, IsPlainUser
from .serializers import (
    ActivityItemSerializer,
    AttendeeSummarySerializer,
    CheckInStatisticsSerializer,
    EventStatisticsSerializer,
    EventSummarySerializer,
    NotificationSummarySerializer,
    OrderSummarySerializer,
    OrganizerProfileSummarySerializer,
    PaymentSummarySerializer,
    QRScanStatisticsSerializer,
    RevenueAnalyticsSerializer,
    TicketSalesSummarySerializer,
    TicketSummarySerializer,
    UserProfileSummarySerializer,
    AdminPlatformStatisticsSerializer,
    AdminRevenueStatisticsSerializer,
)

# ==================== USER DASHBOARD: PROFILE SUMMARY ====================


class UserDashboardSummaryView(RetrieveAPIView):
    """Return the authenticated USER's dashboard profile-summary card."""

    permission_classes = [
        IsAuthenticated,
        IsPlainUser,
    ]

    serializer_class = UserProfileSummarySerializer

    def get_object(self):
        return services.get_user_profile_summary(self.request.user)

    @extend_schema(
        operation_id="getUserDashboardSummary",
        summary="Get user dashboard summary",
        description=(
                "Return the authenticated user's dashboard summary card: "
                "upcoming ticket count, total ticket count, and unread "
                "notification count."
        ),
        tags=["Dashboard: User"],
        responses=UserProfileSummarySerializer,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ==================== USER DASHBOARD: TICKETS ====================


class UpcomingTicketsView(APIView):
    """List the authenticated user's upcoming (not-yet-happened) tickets."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="listUpcomingTickets",
        summary="List upcoming tickets",
        description=(
                "Return the authenticated user's tickets for events that "
                "haven't happened yet."
        ),
        tags=["Me: Tickets"],
        responses=TicketSummarySerializer(many=True),
    )
    def get(self, request):
        tickets = services.list_upcoming_tickets(request.user)
        return Response(TicketSummarySerializer(tickets, many=True).data)


class TicketHistoryView(APIView):
    """List all of the authenticated user's tickets, past and future."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="listTicketHistory",
        summary="List ticket history",
        description=(
                "Return every ticket the authenticated user has ever "
                "booked, regardless of event date. "
                "Deprecated route — use GET /me/tickets/ (api/me/tickets/) instead, "
                "which serves the same dataset."
        ),
        tags=["Me: Tickets"],
        responses=TicketSummarySerializer(many=True),
    )
    def get(self, request):
        tickets = services.list_ticket_history(request.user)
        return Response(TicketSummarySerializer(tickets, many=True).data)


class TicketReceiptDownloadView(APIView):
    """Download the receipt PDF for one of the authenticated user's own tickets."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="downloadTicketReceipt",
        summary="Download ticket receipt",
        description=(
                "Return the receipt PDF for a ticket belonging to the "
                "authenticated user. Not yet available: returns 501 until "
                "the tickets app exists."
        ),
        tags=["Me: Tickets"],
        responses={
            200: OpenApiResponse(description="Receipt PDF bytes."),
            501: OpenApiResponse(description="Receipt download is not yet available."),
        },
    )
    def get(self, request, ticket_id: int):
        pdf_bytes = services.get_ticket_receipt_pdf(request.user, ticket_id=ticket_id)
        return HttpResponse(pdf_bytes, content_type="application/pdf")


# ==================== USER DASHBOARD: PAYMENTS ====================


class PaymentHistoryView(APIView):
    """List the authenticated user's payment history."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="listPaymentHistory",
        summary="List payment history",
        description="Return every payment made by the authenticated user.",
        tags=["Me: Payments"],
        responses=PaymentSummarySerializer(many=True),
    )
    def get(self, request):
        payments = services.list_payment_history(request.user)
        return Response(PaymentSummarySerializer(payments, many=True).data)


# ==================== USER DASHBOARD: EVENTS & ACTIVITY ====================


class UpcomingEventsView(APIView):
    """List events the authenticated user might want to attend."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="listUserUpcomingEvents",
        summary="List upcoming events",
        description="Return upcoming events relevant to the authenticated user.",
        tags=["Me: Events"],
        responses=EventSummarySerializer(many=True),
    )
    def get(self, request):
        events = services.list_upcoming_events(request.user)
        return Response(EventSummarySerializer(events, many=True).data)


class RecentActivityView(APIView):
    """List the authenticated user's recent account activity."""

    permission_classes = [
    IsAuthenticated,
    IsPlainUser,
]

    @extend_schema(
        operation_id="listRecentActivity",
        summary="List recent activity",
        description=(
                "Return a chronological feed of the authenticated user's "
                "recent activity (e.g. bookings, payments, verification "
                "events)."
        ),
        tags=["Dashboard: User"],
        responses=ActivityItemSerializer(many=True),
    )
    def get(self, request):
        activity = services.list_recent_activity(request.user)
        return Response(ActivityItemSerializer(activity, many=True).data)


# ==================== NOTIFICATIONS (future-ready, shared) ====================


class NotificationListView(APIView):
    """
    List the authenticated user's notifications. Available to both USER
    and ORGANIZER accounts, since notifications aren't role-specific.
    """

    permission_classes = [
    IsAuthenticated,
]

    @extend_schema(
        operation_id="listNotifications",
        summary="List notifications",
        description=(
                "Return the authenticated user's notifications. Pass "
                "?unread_only=true to return only unread notifications."
        ),
        tags=["Dashboard: Notifications"],
        responses=NotificationSummarySerializer(many=True),
    )
    def get(self, request):
        unread_only = request.query_params.get("unread_only", "").lower() == "true"
        notifications = services.list_notifications(request.user, unread_only=unread_only)
        return Response(NotificationSummarySerializer(notifications, many=True).data)


# ==================== ORGANIZER DASHBOARD: PROFILE SUMMARY ====================


class OrganizerDashboardSummaryView(RetrieveAPIView):
    """Return the authenticated ORGANIZER's dashboard profile-summary card."""

    permission_classes = [
        IsAuthenticated,
        IsOrganizer,
    ]
    serializer_class = OrganizerProfileSummarySerializer

    def get_object(self):
        profile = self.request.user.organizer_profile
        return services.get_organizer_profile_summary(profile)

    @extend_schema(
        operation_id="getOrganizerDashboardSummary",
        summary="Get organizer dashboard summary",
        description=(
                "Return the authenticated organizer's dashboard summary "
                "card: total events, upcoming events, and unread "
                "notification count."
        ),
        tags=["Dashboard: Organizer"],
        responses=OrganizerProfileSummarySerializer,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ==================== ORGANIZER DASHBOARD: EVENTS ====================


class OrganizerEventListView(APIView):
    """List all events belonging to the authenticated organizer."""

    permission_classes = [
        IsAuthenticated,
        IsOrganizer,
    ]

    @extend_schema(
        operation_id="listDashboardOrganizerEvents",
        summary="List organizer's events (dashboard)",
        description="Return every event belonging to the authenticated organizer, for the dashboard event-list card.",
        tags=["Dashboard: Organizer"],
        responses=EventSummarySerializer(many=True),
    )
    def get(self, request):
        profile = request.user.organizer_profile
        events = services.list_organizer_events(profile)
        return Response(EventSummarySerializer(events, many=True).data)


class OrganizerUpcomingEventListView(APIView):
    """List the authenticated organizer's events that haven't started yet."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="listOrganizerUpcomingEvents",
        summary="List organizer's upcoming events",
        description="Return the authenticated organizer's events that haven't started yet.",
        tags=["Dashboard: Organizer"],
        responses=EventSummarySerializer(many=True),
    )
    def get(self, request):
        profile = request.user.organizer_profile
        events = services.list_organizer_upcoming_events(profile)
        return Response(EventSummarySerializer(events, many=True).data)


class EventAttendeeListView(APIView):
    """List attendees for one of the authenticated organizer's events."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="listEventAttendees",
        summary="List event attendees",
        description="Return attendees for a specific event owned by the authenticated organizer.",
        tags=["Dashboard: Organizer"],
        responses=AttendeeSummarySerializer(many=True),
    )
    def get(self, request, event_id: int):
        profile = request.user.organizer_profile
        attendees = services.list_event_attendees(profile, event_id=event_id)
        return Response(AttendeeSummarySerializer(attendees, many=True).data)


# ==================== ORGANIZER DASHBOARD: STATISTICS & ANALYTICS ====================


class EventStatisticsView(APIView):
    """Aggregate event statistics for the authenticated organizer."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="getEventStatistics",
        summary="Get event statistics",
        description=(
                "Return aggregate statistics across the authenticated "
                "organizer's events: total events, tickets sold, and "
                "attendees checked in."
        ),
        tags=["Dashboard: Organizer"],
        responses=EventStatisticsSerializer,
    )
    def get(self, request):
        profile = request.user.organizer_profile
        stats = services.get_event_statistics(profile)
        return Response(EventStatisticsSerializer(stats).data)


class RevenueAnalyticsView(APIView):
    """Aggregate revenue analytics for the authenticated organizer."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="getRevenueAnalytics",
        summary="Get revenue analytics",
        description=(
                "Return the authenticated organizer's total revenue and "
                "a month-by-month breakdown, suitable for charting."
        ),
        tags=["Dashboard: Organizer"],
        responses=RevenueAnalyticsSerializer,
    )
    def get(self, request):
        profile = request.user.organizer_profile
        analytics = services.get_revenue_analytics(profile)
        return Response(RevenueAnalyticsSerializer(analytics).data)


class TicketSalesSummaryView(APIView):
    """Ticket sales summary for the authenticated organizer."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="getTicketSalesSummary",
        summary="Get ticket sales summary",
        description="Return total tickets sold vs. available across the organizer's events.",
        tags=["Dashboard: Organizer"],
        responses=TicketSalesSummarySerializer,
    )
    def get(self, request):
        profile = request.user.organizer_profile
        summary = services.get_ticket_sales_summary(profile)
        return Response(TicketSalesSummarySerializer(summary).data)


class CheckInStatisticsView(APIView):
    """Check-in statistics for the authenticated organizer's events."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="getCheckInStatistics",
        summary="Get check-in statistics",
        description="Return total attendees checked in vs. expected across the organizer's events.",
        tags=["Dashboard: Organizer"],
        responses=CheckInStatisticsSerializer,
    )
    def get(self, request):
        profile = request.user.organizer_profile
        stats = services.get_checkin_statistics(profile)
        return Response(CheckInStatisticsSerializer(stats).data)


class QRScanStatisticsView(APIView):
    """QR scan statistics for the authenticated organizer's events."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="getQRScanStatistics",
        summary="Get QR scan statistics",
        description=(
                "Return total, valid, and invalid QR scans across the "
                "organizer's events."
        ),
        tags=["Dashboard: Organizer"],
        responses=QRScanStatisticsSerializer,
    )
    def get(self, request):
        profile = request.user.organizer_profile
        stats = services.get_qr_scan_statistics(profile)
        return Response(QRScanStatisticsSerializer(stats).data)


# ==================== ORGANIZER DASHBOARD: ORDERS ====================


class RecentOrdersView(APIView):
    """List recent orders across the authenticated organizer's events."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="listRecentOrders",
        summary="List recent orders",
        description="Return the most recent orders placed for the organizer's events.",
        tags=["Dashboard: Organizer"],
        responses=OrderSummarySerializer(many=True),
    )
    def get(self, request):
        profile = request.user.organizer_profile
        orders = services.list_recent_orders(profile)
        return Response(OrderSummarySerializer(orders, many=True).data)


# ==================== ORGANIZER DASHBOARD: EXPORTS (future-ready) ====================


class ReportExportView(APIView):
    """Export a downloadable report for one of the organizer's analytics views."""

    permission_classes = [
    IsAuthenticated,
    IsOrganizer,
]

    @extend_schema(
        operation_id="exportReport",
        summary="Export report",
        description=(
                "Generate and return a downloadable report (CSV/PDF) for "
                "one of the organizer's analytics views. Not yet "
                "available: returns 501 until the underlying analytics "
                "data sources exist."
        ),
        tags=["Dashboard: Organizer"],
        responses={
            200: OpenApiResponse(description="Report file bytes."),
            501: OpenApiResponse(description="Report export is not yet available."),
        },
    )
    def get(self, request, report_type: str):
        profile = request.user.organizer_profile
        report_bytes = services.export_report(profile, report_type=report_type)
        return HttpResponse(report_bytes, content_type="application/octet-stream")


# ==================== ADMIN DASHBOARD ====================

class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="getAdminDashboardSummary",
        summary="Admin platform-wide metrics",
        tags=["Dashboard: Admin"],
        responses={200: AdminPlatformStatisticsSerializer}
    )
    def get(self, request):
        stats = services.get_admin_platform_statistics(request.user)
        return Response(AdminPlatformStatisticsSerializer(stats).data)


class AdminRevenueAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="getAdminRevenueAnalytics",
        summary="Admin platform-wide revenue",
        tags=["Dashboard: Admin"],
        responses={200: AdminRevenueStatisticsSerializer}
    )
    def get(self, request):
        stats = services.get_admin_revenue_statistics(request.user)
        return Response(AdminRevenueStatisticsSerializer(stats).data)