"""
Standalone payment resource endpoints.
Mounted at api/payments/ in config/urls.py.

Booking-scoped payment actions (initiate, verify) live in apps/payments/urls.py,
mounted at api/bookings/ — because payment initiation only makes sense within
the context of a specific booking.

Next route to add here once PaymentDetailView is built:

    from .views import PaymentDetailView
    path("<uuid:reference_id>/", PaymentDetailView.as_view(), name="payment-detail"),

The Payment model uses reference_id (UUIDField) as the public identifier
for status checks, receipts, and webhook reconciliation.
"""

urlpatterns = []
