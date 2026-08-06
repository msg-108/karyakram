from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.bookings.models import Booking
from .models import Payment
from .serializers import PaymentInitiateSerializer, PaymentVerifySerializer
from . import services

class PaymentInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="initiatePayment",
        summary="Initiate a payment for a booking",
        tags=["Payments"],
        request=PaymentInitiateSerializer,
        responses={200: OpenApiResponse(description="Payment data or URL for frontend to process")}
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
        elif provider == Payment.Provider.KHALTI:
            data = services.initiate_khalti_payment(payment)
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
            400: OpenApiResponse(description="Payment verification failed")
        }
    )
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        payment = get_object_or_404(Payment, booking=booking)
        
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data["provider"]
        
        if provider != payment.provider:
            raise ValidationError("Provider mismatch for this payment.")
        
        if payment.status == Payment.Status.COMPLETED:
            return Response({"detail": "Payment already completed."})

        if provider == Payment.Provider.ESEWA:
            payment = services.verify_esewa_payment(payment)
        elif provider == Payment.Provider.KHALTI:
            pidx = serializer.validated_data.get("pidx")
            if not pidx:
                raise ValidationError({"pidx": "Required for Khalti verification."})
            payment = services.verify_khalti_payment(payment, pidx)

        if payment.status == Payment.Status.COMPLETED:
            # We will refactor this in Part 6 to call bookings.services.confirm_booking
            if booking.status == Booking.Status.PENDING:
                booking.status = Booking.Status.CONFIRMED
                booking.save(update_fields=["status", "updated_at"])
            return Response({"detail": "Payment verified successfully."})
        else:
            return Response({"detail": "Payment failed or still pending."}, status=400)


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getPaymentStatus",
        summary="Check payment status",
        tags=["Payments"],
        responses={200: PaymentSerializer}
    )
    def get(self, request, reference_id):
        payment = get_object_or_404(Payment, reference_id=reference_id, booking__user=request.user)
        from .serializers import PaymentSerializer
        return Response(PaymentSerializer(payment).data)

