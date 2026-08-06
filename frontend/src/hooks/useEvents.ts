import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import { queryKeys } from '../config/queryClient';
import { EventFilterParams } from '../types/event.types';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../lib/api';

export function usePublicCategories() {
  return useQuery({
    queryKey: queryKeys.events.categories(),
    queryFn: () => eventService.listCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function usePublicEvents(params?: EventFilterParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params as Record<string, unknown>),
    queryFn: () => eventService.listPublicEvents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

export function usePublicEvent(slug: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(slug),
    queryFn: () => eventService.getPublicEvent(slug),
    enabled: Boolean(slug),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: queryKeys.organizer.events(),
    queryFn: () => eventService.listOrganizerEvents(),
  });
}

export function useOrganizerEventDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.organizer.eventDetail(id),
    queryFn: () => eventService.getOrganizerEvent(id),
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: eventService.createOrganizerEvent,
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.events() });
      toast.success(`Event "${event.title}" saved as draft!`);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useSubmitEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (eventId: number) => eventService.submitEventForReview(eventId),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.eventDetail(event.id) });
      toast.success('Event submitted for admin review!');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
