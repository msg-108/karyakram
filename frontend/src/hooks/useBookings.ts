import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { queryKeys } from '../config/queryClient';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../lib/api';
import { BookingCreateRequest, PaymentInitiateRequest, PaymentVerifyRequest } from '../types/booking.types';

export function useUserBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.list(),
    queryFn: () => bookingService.listUserBookings(),
    staleTime: 0, // Always refetch for latest booking status
  });
}

export function useBookingDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getBooking(id),
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: BookingCreateRequest) => bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      toast.success('Tickets reserved! Please complete payment.');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useInitiatePayment() {
  const toast = useToast();

  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: PaymentInitiateRequest }) =>
      bookingService.initiatePayment(bookingId, data),
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: PaymentVerifyRequest }) =>
      bookingService.verifyPayment(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all() });
      toast.success('Payment verified successfully! Your tickets are issued.');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (bookingId: number) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      toast.info('Booking has been cancelled.');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useMyTickets(page = 1) {
  return useQuery({
    queryKey: queryKeys.tickets.mine(page),
    queryFn: () => bookingService.listMyTickets(page),
    staleTime: 0,
  });
}
