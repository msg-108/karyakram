from django.urls import path

from .views import BookingCancelView, BookingDetailView, BookingListCreateView

app_name = "bookings"

urlpatterns = [
    path("bookings/", BookingListCreateView.as_view(), name="booking-list-create"),
    path("bookings/<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("bookings/<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
]