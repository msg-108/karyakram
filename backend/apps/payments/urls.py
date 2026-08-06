from django.urls import path

from .views import PaymentInitiateView, PaymentVerifyView

app_name = "payments"

# Mounted at api/bookings/ in config/urls.py.
# Payment actions are booking-scoped: initiation and verification only make sense
# in the context of a specific booking, so they nest under it.
# Standalone payment resource paths (future GET /payments/<id>/) live in
# standalone_urls.py, mounted at api/payments/.
urlpatterns = [
    path("<int:booking_id>/payment/initiate/", PaymentInitiateView.as_view(), name="payment-initiate"),
    path("<int:booking_id>/payment/verify/", PaymentVerifyView.as_view(), name="payment-verify"),
]