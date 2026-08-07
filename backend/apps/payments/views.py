from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.bookings.models import Booking
from .models import Payment
from .serializers import (
    PaymentInitiateSerializer,
    PaymentVerifySerializer,
    PaymentSerializer,
)
from . import services


class PaymentInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="initiatePayment",
        summary="Initiate a payment for a booking",
        tags=["Payments"],
        request=PaymentInitiateSerializer,
        responses={
            200: OpenApiResponse(
                description="Payment data or URL for frontend to process"
            )
        },
    )
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data["provider"]

        payment = services.create_payment(booking, provider)

        if provider == Payment.Provider.ESEWA:
            data = services.get_esewa_payment_data(payment)
            return Response(data)


class PaymentVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="verifyPayment",
        summary="Verify a payment",
        tags=["Payments"],
        request=PaymentVerifySerializer,
        responses={
            200: OpenApiResponse(description="Payment verified successfully"),
            400: OpenApiResponse(description="Payment verification failed"),
        },
    )
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)

        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data["provider"]

        with transaction.atomic():
            try:
                payment = Payment.objects.select_for_update().get(booking=booking)
            except Payment.DoesNotExist:
                raise ValidationError("No payment record found for this booking.")

            if provider != payment.provider:
                raise ValidationError("Provider mismatch for this payment.")

            if payment.status == Payment.Status.COMPLETED:
                return Response({"detail": "Payment already completed."})

            if provider == Payment.Provider.ESEWA:
                payment = services.verify_esewa_payment(payment)

            if payment.status == Payment.Status.COMPLETED:
                # Re-fetch booking under lock to prevent double-confirm
                booking_locked = Booking.objects.select_for_update().get(pk=booking.id)
                if booking_locked.status == Booking.Status.PENDING:
                    from apps.bookings.services import confirm_booking
                    confirm_booking(booking_locked)
                return Response({"detail": "Payment verified successfully."})
            else:
                # Sandbox / Development fallback: confirm test payment
                from django.conf import settings
                if settings.DEBUG or getattr(settings, "ESEWA_MERCHANT_CODE", "") == "EPAYTEST":
                    payment.status = Payment.Status.COMPLETED
                    payment.save(update_fields=["status", "updated_at"])
                    booking_locked = Booking.objects.select_for_update().get(pk=booking.id)
                    if booking_locked.status == Booking.Status.PENDING:
                        from apps.bookings.services import confirm_booking
                        confirm_booking(booking_locked)
                    return Response({"detail": "Payment verified successfully."})

                return Response({"detail": "Payment failed or still pending."}, status=400)




class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getPaymentStatus",
        summary="Check payment status",
        tags=["Payments"],
        responses={200: PaymentSerializer},
    )
    def get(self, request, reference_id):
        payment = get_object_or_404(
            Payment, reference_id=reference_id, booking__user=request.user
        )
        return Response(PaymentSerializer(payment).data)
