from django.urls import path
from .views import UserTicketListView, CheckInView

app_name = "tickets"

urlpatterns = [
    path("me/tickets/", UserTicketListView.as_view(), name="my-tickets"),
    path("events/<int:event_id>/check-in/", CheckInView.as_view(), name="check-in"),
]
