from django.urls import path
from .views import PaymentInitiateView, PaymentVerifyView

app_name = "payments"

urlpatterns = [
    path("bookings/<int:booking_id>/payment/initiate/", PaymentInitiateView.as_view(), name="payment-initiate"),
    path("bookings/<int:booking_id>/payment/verify/", PaymentVerifyView.as_view(), name="payment-verify"),
]
