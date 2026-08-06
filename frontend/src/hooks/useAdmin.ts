import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { eventService } from '../services/event.service';
import { queryKeys } from '../config/queryClient';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../lib/api';
import { ApprovalActionFormData } from '../schemas/event.schema';

export function usePendingOrganizers() {
  return useQuery({
    queryKey: queryKeys.admin.pendingOrganizers(),
    queryFn: () => dashboardService.listPendingOrganizers(),
    staleTime: 30 * 1000,
  });
}

export function useApproveOrRejectOrganizer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: ApprovalActionFormData }) =>
      dashboardService.approveOrRejectOrganizer(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingOrganizers() });
      toast.success(
        `Organizer account ${variables.data.action === 'approve' ? 'approved' : 'rejected'}.`
      );
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function usePendingEvents() {
  return useQuery({
    queryKey: queryKeys.admin.pendingEvents(),
    queryFn: () => eventService.listPendingEvents(),
    staleTime: 30 * 1000,
  });
}

export function useApproveOrRejectEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: ApprovalActionFormData }) =>
      eventService.approveOrRejectEvent(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingEvents() });
      toast.success(`Event ${variables.data.action === 'approve' ? 'approved' : 'rejected'}.`);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (eventId: number) => eventService.publishEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingEvents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
      toast.success('Event published to public listing!');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
