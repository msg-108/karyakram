from django.urls import path

from .views import BookingCancelView, BookingDetailView, BookingListCreateView

app_name = "bookings"

# Mounted at api/bookings/ in config/urls.py.
# Rule: paths here are relative to that prefix — do not repeat 'bookings/' inside this file.
urlpatterns = [
    path("", BookingListCreateView.as_view(), name="booking-list-create"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
]