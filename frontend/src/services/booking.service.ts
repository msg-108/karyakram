import { api } from '../lib/api';
import {
  BookingCreateRequest,
  BookingDetail,
  BookingList,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentVerifyRequest,
  Ticket,
} from '../types/booking.types';
import { PaginatedResponse } from '../types/common.types';

export const bookingService = {
  async createBooking(data: BookingCreateRequest): Promise<BookingDetail> {
    const res = await api.post<BookingDetail>('/bookings/', data);
    return res.data;
  },

  async listUserBookings(page = 1): Promise<PaginatedResponse<BookingList>> {
    const res = await api.get<PaginatedResponse<BookingList>>('/bookings/', { params: { page } });
    return res.data;
  },

  async getBooking(id: number): Promise<BookingDetail> {
    const res = await api.get<BookingDetail>(`/bookings/${id}/`);
    return res.data;
  },

  async cancelBooking(id: number): Promise<BookingDetail> {
    const res = await api.post<BookingDetail>(`/bookings/${id}/cancel/`);
    return res.data;
  },

  async initiatePayment(bookingId: number, data: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const res = await api.post<PaymentInitiateResponse>(`/bookings/${bookingId}/payment/initiate/`, data);
    return res.data;
  },

  async verifyPayment(bookingId: number, data: PaymentVerifyRequest): Promise<unknown> {
    const res = await api.post(`/bookings/${bookingId}/payment/verify/`, data);
    return res.data;
  },

  async listMyTickets(page = 1): Promise<PaginatedResponse<Ticket>> {
    const res = await api.get<PaginatedResponse<Ticket>>('/me/tickets/', { params: { page } });
    return res.data;
  },
};
