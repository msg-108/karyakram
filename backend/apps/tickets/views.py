from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsOrganizer
from apps.events.models import Event
from . import services
from .models import Ticket
from .serializers import TicketSerializer, CheckInSerializer


class UserTicketListView(generics.ListAPIView):
    """
    List all tickets owned by the current user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    queryset = Ticket.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Ticket.objects.none()

        return services.list_user_tickets(self.request.user)


class CheckInView(APIView):
    """
    Check in a ticket at a specific event.
    Only the event's organizer can do this.
    """

    permission_classes = [IsAuthenticated, IsOrganizer]

    @extend_schema(request=CheckInSerializer, responses={200: TicketSerializer})
    def post(self, request, event_id):
        # Verify the organizer owns this event
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if event.organizer.user != request.user:
            return Response(
                {
                    "detail": "You do not have permission to check in tickets for this event."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = services.check_in_ticket(
            qr_payload=serializer.validated_data["qr_payload"], event_id=event.id
        )

        response_serializer = TicketSerializer(ticket)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
