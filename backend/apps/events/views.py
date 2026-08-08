"""
Thin API views. Every view delegates to `services` for anything beyond
request parsing / permission checks / response shaping.
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Event, EventCategory, TicketTier
from apps.common.permissions import (
    CanApproveEvent,
    IsApprovedOrganizer,
    IsEventOwner,
    IsOrganizer,
)
from .serializers import (
    AdminEventDetailSerializer,
    AdminEventReviewSerializer,
    EventApprovalActionSerializer,
    EventCategorySerializer,
    OrganizerEventDetailSerializer,
    OrganizerEventListSerializer,
    OrganizerEventWriteSerializer,
    PublicEventDetailSerializer,
    PublicEventListSerializer,
    TicketTierSerializer,
)

# ==================== PUBLIC: CATEGORIES ====================


class PublicCategoryListView(ListAPIView):
    """List active event categories. Public, no authentication required."""

    permission_classes = []
    serializer_class = EventCategorySerializer
    pagination_class = None

    def get_queryset(self):
        return EventCategory.objects.filter(is_active=True)

    @extend_schema(
        operation_id="listPublicCategories",
        summary="List event categories",
        description="Return all active event categories, for public browsing and filtering.",
        tags=["Events: Public"],
        responses=EventCategorySerializer(many=True),
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ==================== PUBLIC: EVENTS ====================


class PublicEventListView(ListAPIView):
    """
    Browse, search, and filter published/public events.

    Query params:
    - `q`: free-text search across title/description/venue/city
    - `category`: filter by category slug
    - `city`: filter by exact city match
    - `start_date_from` / `start_date_to`: filter by start_datetime range (ISO 8601)
    """

    permission_classes = []
    serializer_class = PublicEventListSerializer

    def get_queryset(self):
        queryset = services.list_public_events()

        query = self.request.query_params.get("q") or self.request.query_params.get("search")
        if query:
            queryset = services.search_events(queryset, query=query)

        queryset = services.filter_events(
            queryset,
            category_slug=self.request.query_params.get("category"),
            city=self.request.query_params.get("city"),
            start_date_from=self.request.query_params.get("start_date_from"),
            start_date_to=self.request.query_params.get("start_date_to"),
        )
        return queryset

    @extend_schema(
        operation_id="listPublicEvents",
        summary="Browse published events",
        description=(
            "Return published, publicly-visible events. Supports free-text search "
            "and filtering by category, city, and date range via query parameters."
        ),
        tags=["Events: Public"],
        parameters=[
            OpenApiParameter("q", str, description="Free-text search query."),
            OpenApiParameter(
                "category", str, description="Category slug to filter by."
            ),
            OpenApiParameter(
                "city", str, description="City to filter by (exact match)."
            ),
            OpenApiParameter(
                "start_date_from", str, description="ISO 8601 datetime lower bound."
            ),
            OpenApiParameter(
                "start_date_to", str, description="ISO 8601 datetime upper bound."
            ),
        ],
        responses=PublicEventListSerializer(many=True),
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class PublicEventDetailView(RetrieveAPIView):
    """Retrieve a single published, public event by its slug."""

    permission_classes = []
    serializer_class = PublicEventDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return services.list_public_events()

    @extend_schema(
        operation_id="getPublicEvent",
        summary="Get event details",
        description="Return full details for a single published, publicly-visible event.",
        tags=["Events: Public"],
        responses={
            200: PublicEventDetailSerializer,
            404: OpenApiResponse(
                description="Event not found or not publicly visible."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ==================== ORGANIZER: EVENTS ====================


class OrganizerEventListCreateView(APIView):
    """List the authenticated organizer's own events, or create a new one."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    @extend_schema(
        operation_id="listOrganizerEvents",
        summary="List organizer's events",
        description="Return every event belonging to the authenticated organizer, in any status.",
        tags=["Events: Organizer"],
        responses=OrganizerEventListSerializer(many=True),
    )
    def get(self, request):
        events = services.list_organizer_events(request.user.organizer_profile)
        return Response(OrganizerEventListSerializer(events, many=True).data)

    @extend_schema(
        operation_id="createOrganizerEvent",
        summary="Create a draft event",
        description=(
            "Create a new event in DRAFT status, owned by the authenticated organizer. "
            "Ticket tiers may optionally be supplied inline; at least one tier is "
            "required before the event can later be submitted for review."
        ),
        tags=["Events: Organizer"],
        request=OrganizerEventWriteSerializer,
        responses={
            201: OpenApiResponse(
                OrganizerEventDetailSerializer, description="Event created."
            ),
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def post(self, request):
        serializer = OrganizerEventWriteSerializer(
            data=request.data, context={"organizer": request.user.organizer_profile}
        )
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(
            serializer.to_representation(event), status=status.HTTP_201_CREATED
        )


class OrganizerEventDetailView(APIView):
    """Retrieve, update, or delete one of the authenticated organizer's own events."""

    permission_classes = [IsAuthenticated, IsOrganizer, IsEventOwner]

    def get_object(self, pk: int) -> Event:
        event = get_object_or_404(Event, pk=pk)
        self.check_object_permissions(self.request, event)
        return event

    @extend_schema(
        operation_id="getOrganizerEvent",
        summary="Get one of the organizer's own events",
        description="Return full details for a single event owned by the authenticated organizer.",
        tags=["Events: Organizer"],
        responses=OrganizerEventDetailSerializer,
    )
    def get(self, request, pk: int):
        event = self.get_object(pk)
        return Response(OrganizerEventDetailSerializer(event).data)

    @extend_schema(
        operation_id="updateOrganizerEvent",
        summary="Update a draft or rejected event",
        description=(
            "Update an event owned by the authenticated organizer. Only permitted "
            "while the event is DRAFT or REJECTED; a REJECTED event moves back to "
            "DRAFT as soon as it's edited."
        ),
        tags=["Events: Organizer"],
        request=OrganizerEventWriteSerializer,
        responses={
            200: OpenApiResponse(
                OrganizerEventDetailSerializer, description="Event updated."
            ),
            400: OpenApiResponse(
                description="Validation error, or event is not editable."
            ),
        },
    )
    def patch(self, request, pk: int):
        event = self.get_object(pk)
        serializer = OrganizerEventWriteSerializer(
            event,
            data=request.data,
            partial=True,
            context={"organizer": request.user.organizer_profile},
        )
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(serializer.to_representation(event))

    @extend_schema(
        operation_id="deleteOrganizerEvent",
        summary="Delete a draft or rejected event",
        description="Permanently delete an event owned by the authenticated organizer. Only DRAFT or REJECTED events can be deleted.",
        tags=["Events: Organizer"],
        responses={
            204: OpenApiResponse(description="Event deleted."),
            400: OpenApiResponse(description="Event is not in a deletable status."),
        },
    )
    def delete(self, request, pk: int):
        event = self.get_object(pk)
        services.delete_event(event)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganizerEventSubmitView(APIView):
    """Submit a draft/rejected event for admin review."""

    permission_classes = [IsAuthenticated, IsApprovedOrganizer, IsEventOwner]

    @extend_schema(
        operation_id="submitEventForReview",
        summary="Submit event for review",
        description=(
            "Move a DRAFT or REJECTED event to SUBMITTED, placing it in the admin "
            "review queue. Requires the organizer's own account to be approved and "
            "the event to have at least one ticket tier."
        ),
        tags=["Events: Organizer"],
        request=None,
        responses={
            200: OpenApiResponse(
                OrganizerEventDetailSerializer, description="Event submitted."
            ),
            400: OpenApiResponse(
                description="Event is not in a submittable status, or has no ticket tiers."
            ),
            403: OpenApiResponse(
                description="Organizer account is not approved, or does not own this event."
            ),
        },
    )
    def post(self, request, pk: int):
        event = get_object_or_404(Event, pk=pk)
        self.check_object_permissions(request, event)
        event = services.submit_event_for_review(
            event, organizer=request.user.organizer_profile
        )
        return Response(OrganizerEventDetailSerializer(event).data)


# ==================== ORGANIZER: TICKET TIERS ====================


class OrganizerTicketTierListCreateView(APIView):
    """List or create ticket tiers for one of the authenticated organizer's own events."""

    permission_classes = [IsAuthenticated, IsOrganizer, IsEventOwner]

    def get_event(self, pk: int) -> Event:
        event = get_object_or_404(Event, pk=pk)
        self.check_object_permissions(self.request, event)
        return event

    @extend_schema(
        operation_id="listEventTicketTiers",
        summary="List an event's ticket tiers",
        description="Return every ticket tier defined for the given event.",
        tags=["Events: Organizer"],
        responses=TicketTierSerializer(many=True),
    )
    def get(self, request, pk: int):
        event = self.get_event(pk)
        return Response(TicketTierSerializer(event.ticket_tiers.all(), many=True).data)

    @extend_schema(
        operation_id="createEventTicketTier",
        summary="Add a ticket tier",
        description="Create a new ticket tier for the given event. Only permitted while the event is a draft.",
        tags=["Events: Organizer"],
        request=TicketTierSerializer,
        responses={
            201: OpenApiResponse(
                TicketTierSerializer, description="Ticket tier created."
            ),
            400: OpenApiResponse(
                description="Validation error, or event is not a draft."
            ),
        },
    )
    def post(self, request, pk: int):
        event = self.get_event(pk)
        serializer = TicketTierSerializer(data=request.data, context={"event": event})
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()
        return Response(TicketTierSerializer(tier).data, status=status.HTTP_201_CREATED)


class OrganizerTicketTierDetailView(APIView):
    """Update or delete a single ticket tier belonging to one of the organizer's own events."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_object(self, event_id: int, tier_id: int) -> TicketTier:
        # Scope the lookup by both event and tier so the URL structure (which
        # carries event_id) is enforced at the query level, not just checked after.
        # This also implicitly verifies organizer ownership via the event FK chain.
        organizer_profile = getattr(self.request.user, "organizer_profile", None)
        if organizer_profile is None:
            raise PermissionDenied(
                "You do not have permission to modify this ticket tier."
            )
        tier = get_object_or_404(
            TicketTier.objects.select_related("event"),
            pk=tier_id,
            event__id=event_id,
            event__organizer=organizer_profile,
        )
        return tier

    @extend_schema(
        operation_id="updateTicketTier",
        summary="Update a ticket tier",
        description="Update a ticket tier belonging to one of the organizer's own events. Only permitted while the event is a draft.",
        tags=["Events: Organizer"],
        request=TicketTierSerializer,
        responses={
            200: OpenApiResponse(
                TicketTierSerializer, description="Ticket tier updated."
            ),
            400: OpenApiResponse(
                description="Validation error, or event is not a draft."
            ),
        },
    )
    def patch(self, request, event_id: int, tier_id: int):
        tier = self.get_object(event_id, tier_id)
        serializer = TicketTierSerializer(tier, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()
        return Response(TicketTierSerializer(tier).data)

    @extend_schema(
        operation_id="deleteTicketTier",
        summary="Delete a ticket tier",
        description="Delete a ticket tier belonging to one of the organizer's own events. Only permitted while the event is a draft.",
        tags=["Events: Organizer"],
        responses={
            204: OpenApiResponse(description="Ticket tier deleted."),
            400: OpenApiResponse(description="Event is not a draft."),
        },
    )
    def delete(self, request, event_id: int, tier_id: int):
        tier = self.get_object(event_id, tier_id)
        services.delete_ticket_tier(tier)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== ORGANIZER: GALLERY IMAGES ====================





# ==================== ADMIN: EVENT REVIEW ====================


class AdminPendingEventListView(APIView):
    """List events awaiting admin review (status=SUBMITTED). Admin only."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="listPendingEvents",
        summary="List pending events",
        description="Return all events currently awaiting admin review.",
        tags=["Admin: Events"],
        responses=AdminEventReviewSerializer(many=True),
    )
    def get(self, request):
        events = services.list_pending_events()
        return Response(AdminEventReviewSerializer(events, many=True).data)


class AdminEventDetailView(APIView):
    """Retrieve full details of any event for admin review."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="getAdminEventDetail",
        summary="Get full event details for admin review",
        description="Return complete details of any event for admin review regardless of status.",
        tags=["Admin: Events"],
        responses={
            200: AdminEventDetailSerializer,
            404: OpenApiResponse(description="Event not found."),
        },
    )
    def get(self, request, pk: int):
        event = get_object_or_404(Event, pk=pk)
        return Response(AdminEventDetailSerializer(event).data)


class AdminEventApprovalView(APIView):
    """Approve or reject a submitted event. Admin only."""

    permission_classes = [CanApproveEvent]

    @extend_schema(
        operation_id="approveOrRejectEvent",
        summary="Approve or reject event",
        description=(
            "Approve or reject a SUBMITTED event. Approving does not publish it — "
            "publishing is a separate admin action. Rejecting requires a reason and "
            "returns the event to the organizer for edits."
        ),
        tags=["Admin: Events"],
        request=EventApprovalActionSerializer,
        responses={
            200: OpenApiResponse(
                AdminEventReviewSerializer, description="Event review status updated."
            ),
            400: OpenApiResponse(
                description="Invalid approval request, or event is not submitted."
            ),
            404: OpenApiResponse(description="Event not found."),
        },
    )
    def post(self, request, pk: int):
        event = get_object_or_404(Event, pk=pk)
        serializer = EventApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["action"] == "approve":
            event = services.approve_event(event, admin=request.user)
        else:
            event = services.reject_event(
                event, admin=request.user, reason=serializer.validated_data["reason"]
            )
        return Response(AdminEventReviewSerializer(event).data)


class AdminEventPublishView(APIView):
    """Publish an approved event, making it visible to the public. Admin only."""

    permission_classes = [CanApproveEvent]

    @extend_schema(
        operation_id="publishEvent",
        summary="Publish event",
        description=(
            "Publish an APPROVED event, making it visible to the public "
            "(subject to its visibility setting). Organizers cannot call this "
            "endpoint directly — only an admin can publish."
        ),
        tags=["Admin: Events"],
        request=None,
        responses={
            200: OpenApiResponse(
                AdminEventReviewSerializer, description="Event published."
            ),
            400: OpenApiResponse(description="Event is not approved."),
            404: OpenApiResponse(description="Event not found."),
        },
    )
    def post(self, request, pk: int):
        event = get_object_or_404(Event, pk=pk)
        event = services.publish_event(event, admin=request.user)
        return Response(AdminEventReviewSerializer(event).data)
