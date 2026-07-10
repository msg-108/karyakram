from django.urls import path
from .views import (
    EventListView,
    EventDetailView,
    MyEventsView,
    AdminEventApprovalView,
)

app_name = 'events'

urlpatterns = [
    path('', EventListView.as_view(), name='event-list-create'),
    path('mine/', MyEventsView.as_view(), name='my-events'),
    path('<slug:slug>/', EventDetailView.as_view(), name='event-detail'),
    path('<slug:slug>/approve/', AdminEventApprovalView.as_view(), name='event-approve'),
]