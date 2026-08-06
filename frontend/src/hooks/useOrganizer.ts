import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { queryKeys } from '../config/queryClient';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../lib/api';

export function useOrganizerDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.organizer.summary(),
    queryFn: () => dashboardService.getOrganizerSummary(),
    staleTime: 30 * 1000,
  });
}

export function useOrganizerRecentOrders() {
  return useQuery({
    queryKey: queryKeys.organizer.recentOrders(),
    queryFn: () => dashboardService.getRecentOrders(),
    staleTime: 30 * 1000,
  });
}

export function useOrganizerRevenueAnalytics() {
  return useQuery({
    queryKey: queryKeys.organizer.stats.revenue(),
    queryFn: () => dashboardService.getRevenueAnalytics(),
    staleTime: 60 * 1000,
  });
}

export function useOrganizerTicketSalesSummary() {
  return useQuery({
    queryKey: queryKeys.organizer.stats.tickets(),
    queryFn: () => dashboardService.getTicketSalesSummary(),
    staleTime: 30 * 1000,
  });
}

export function useOrganizerCheckInStats() {
  return useQuery({
    queryKey: queryKeys.organizer.stats.checkIns(),
    queryFn: () => dashboardService.getCheckInStatistics(),
    staleTime: 30 * 1000,
  });
}

export function useEventAttendees(eventId: number) {
  return useQuery({
    queryKey: queryKeys.organizer.eventAttendees(eventId),
    queryFn: () => dashboardService.getEventAttendees(eventId),
    enabled: Boolean(eventId),
  });
}

export function useCheckInTicket() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ eventId, qrPayload }: { eventId: number; qrPayload: string }) =>
      dashboardService.checkInTicket(eventId, qrPayload),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.stats.checkIns() });
      toast.success(`Ticket checked in for ${ticket.attendee_name}!`);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
