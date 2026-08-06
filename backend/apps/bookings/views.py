"""
Thin API views. Every view delegates to `services` for anything beyond
request parsing / permission checks / response shaping.
"""

from __future__ import annotations

from django.http import Http404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Booking
from apps.common.permissions import IsBookingOwner, IsPlainUser
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
)

# ==================== BOOKINGS ====================


class BookingListCreateView(APIView):
    """List the authenticated user's own bookings, or create a new one."""

    permission_classes = [IsAuthenticated, IsPlainUser]

    @extend_schema(
        operation_id="listUserBookings",
        summary="List my bookings",
        description="Return every booking belonging to the authenticated user, in any status.",
        tags=["Bookings"],
        responses=BookingListSerializer(many=True),
    )
    def get(self, request):
        bookings = services.list_user_bookings(request.user)
        return Response(BookingListSerializer(bookings, many=True).data)

    @extend_schema(
        operation_id="createBooking",
        summary="Book tickets for an event",
        description=(
            "Create a booking for one or more ticket tiers of a published event. "
            "Validates availability and deducts remaining ticket quantity "
            "atomically to prevent overselling."
        ),
        tags=["Bookings"],
        request=BookingCreateSerializer,
        responses={
            201: OpenApiResponse(
                BookingDetailSerializer, description="Booking created."
            ),
            400: OpenApiResponse(
                description="Validation error — event not published, deadline passed, "
                "invalid tier, or insufficient remaining quantity."
            ),
        },
    )
    def post(self, request):
        serializer = BookingCreateSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED
        )


class BookingDetailView(APIView):
    """Retrieve a single booking belonging to the authenticated user."""

    permission_classes = [IsAuthenticated, IsPlainUser, IsBookingOwner]

    def get_object(self, pk: int) -> Booking:
        # Scoped by user before fetching (via services.get_user_booking)
        # rather than an unfiltered get_object_or_404 + permission check,
        # so someone else's booking_id 404s the same as a nonexistent one
        # instead of confirming it exists via a 403.
        try:
            booking = services.get_user_booking(self.request.user, booking_id=pk)
        except Booking.DoesNotExist:
            raise Http404
        self.check_object_permissions(self.request, booking)
        return booking

    @extend_schema(
        operation_id="getBooking",
        summary="Get booking details",
        description="Return full details for a single booking owned by the authenticated user.",
        tags=["Bookings"],
        responses={
            200: BookingDetailSerializer,
            404: OpenApiResponse(description="Booking not found."),
        },
    )
    def get(self, request, pk: int):
        booking = self.get_object(pk)
        return Response(BookingDetailSerializer(booking).data)


class BookingCancelView(APIView):
    """Cancel a confirmed booking, restoring its items' quantities."""

    permission_classes = [IsAuthenticated, IsPlainUser, IsBookingOwner]

    def get_object(self, pk: int) -> Booking:
        try:
            booking = services.get_user_booking(self.request.user, booking_id=pk)
        except Booking.DoesNotExist:
            raise Http404
        self.check_object_permissions(self.request, booking)
        return booking

    @extend_schema(
        operation_id="cancelBooking",
        summary="Cancel booking",
        description=(
            "Cancel a CONFIRMED booking owned by the authenticated user, restoring "
            "each item's quantity back onto its ticket tier."
        ),
        tags=["Bookings"],
        request=None,
        responses={
            200: OpenApiResponse(
                BookingDetailSerializer, description="Booking cancelled."
            ),
            400: OpenApiResponse(
                description="Only confirmed bookings can be cancelled."
            ),
            404: OpenApiResponse(description="Booking not found."),
        },
    )
    def post(self, request, pk: int):
        booking = self.get_object(pk)
        booking = services.cancel_booking(booking, user=request.user)
        return Response(BookingDetailSerializer(booking).data)
