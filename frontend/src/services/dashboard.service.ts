import { api } from '../lib/api';
import {
  UserProfileSummary,
  OrganizerProfileSummary,
  EventSummary,
  OrderSummary,
  AttendeeSummary,
  EventStatistics,
  TicketSalesSummary,
  RevenueAnalytics,
  CheckInStatistics,
  QRScanStatistics,
  ActivityItem,
  PaymentSummary,
} from '../types/dashboard.types';
import { OrganizerProfile } from '../types/auth.types';
import { TicketSummary, Ticket } from '../types/booking.types';
import { ApprovalActionFormData } from '../schemas/event.schema';

export const dashboardService = {
  // User dashboard
  async getUserSummary(): Promise<UserProfileSummary> {
    const res = await api.get<UserProfileSummary>('/dashboard/user/summary/');
    return res.data;
  },

  async getUserUpcomingEvents(): Promise<EventSummary[]> {
    const res = await api.get<EventSummary[]>('/dashboard/user/events/upcoming/');
    return res.data;
  },

  async getUserUpcomingTickets(): Promise<TicketSummary[]> {
    const res = await api.get<TicketSummary[]>('/dashboard/user/tickets/upcoming/');
    return res.data;
  },

  async getUserTicketHistory(): Promise<TicketSummary[]> {
    const res = await api.get<TicketSummary[]>('/dashboard/user/tickets/history/');
    return res.data;
  },

  async getUserPaymentHistory(): Promise<PaymentSummary[]> {
    const res = await api.get<PaymentSummary[]>('/dashboard/user/payments/');
    return res.data;
  },

  async getUserRecentActivity(): Promise<ActivityItem[]> {
    const res = await api.get<ActivityItem[]>('/dashboard/user/activity/');
    return res.data;
  },

  // Organizer dashboard & stats
  async getOrganizerSummary(): Promise<OrganizerProfileSummary> {
    const res = await api.get<OrganizerProfileSummary>('/dashboard/organizer/summary/');
    return res.data;
  },

  async getOrganizerEvents(): Promise<EventSummary[]> {
    const res = await api.get<EventSummary[]>('/dashboard/organizer/events/');
    return res.data;
  },

  async getOrganizerUpcomingEvents(): Promise<EventSummary[]> {
    const res = await api.get<EventSummary[]>('/dashboard/organizer/events/upcoming/');
    return res.data;
  },

  async getRecentOrders(): Promise<OrderSummary[]> {
    const res = await api.get<OrderSummary[]>('/dashboard/organizer/orders/recent/');
    return res.data;
  },

  async getEventStatistics(): Promise<EventStatistics> {
    const res = await api.get<EventStatistics>('/dashboard/organizer/statistics/events/');
    return res.data;
  },

  async getTicketSalesSummary(): Promise<TicketSalesSummary> {
    const res = await api.get<TicketSalesSummary>('/dashboard/organizer/statistics/tickets/');
    return res.data;
  },

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const res = await api.get<RevenueAnalytics>('/dashboard/organizer/statistics/revenue/');
    return res.data;
  },

  async getCheckInStatistics(): Promise<CheckInStatistics> {
    const res = await api.get<CheckInStatistics>('/dashboard/organizer/statistics/checkins/');
    return res.data;
  },

  async getQRScanStatistics(): Promise<QRScanStatistics> {
    const res = await api.get<QRScanStatistics>('/dashboard/organizer/statistics/qr-scans/');
    return res.data;
  },

  async getEventAttendees(eventId: number): Promise<AttendeeSummary[]> {
    const res = await api.get<AttendeeSummary[]>(`/dashboard/organizer/events/${eventId}/attendees/`);
    return res.data;
  },

  async checkInTicket(eventId: number, qrPayload: string): Promise<Ticket> {
    const res = await api.post<Ticket>(`/events/${eventId}/check-in/`, { qr_payload: qrPayload });
    return res.data;
  },

  // Admin approval endpoints
  async listPendingOrganizers(): Promise<OrganizerProfile[]> {
    const res = await api.get<OrganizerProfile[]>('/admin/organizers/pending/');
    return res.data;
  },

  async approveOrRejectOrganizer(userId: number, data: ApprovalActionFormData): Promise<OrganizerProfile> {
    const res = await api.post<OrganizerProfile>(`/admin/organizers/${userId}/approval/`, data);
    return res.data;
  },
};
