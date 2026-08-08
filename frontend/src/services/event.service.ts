import { api } from '../lib/api';
import {
  EventCategory,
  PublicEventList,
  PublicEventDetail,
  OrganizerEventList,
  OrganizerEventDetail,
  AdminEventDetail,
  TicketTier,
  EventFilterParams,
} from '../types/event.types';
import { PaginatedResponse } from '../types/common.types';
import { CreateEventFormData, TicketTierInputData, ApprovalActionFormData } from '../schemas/event.schema';
import { AdminEventReview } from '../types/dashboard.types';

export const eventService = {
  async listCategories(): Promise<EventCategory[]> {
    const res = await api.get('/events/categories/');
    const data = res.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray((data as any).results)) {
      return (data as any).results;
    }
    return [];
  },

  async listPublicEvents(params?: EventFilterParams): Promise<PaginatedResponse<PublicEventList>> {
    const res = await api.get<PaginatedResponse<PublicEventList>>('/events/', { params });
    return res.data;
  },

  async getPublicEvent(slug: string): Promise<PublicEventDetail> {
    const res = await api.get<PublicEventDetail>(`/events/${slug}/`);
    return res.data;
  },

  async listOrganizerEvents(): Promise<OrganizerEventList[]> {
    const res = await api.get<OrganizerEventList[]>('/events/organizer/');
    return res.data;
  },

  async getOrganizerEvent(id: number): Promise<OrganizerEventDetail> {
    const res = await api.get<OrganizerEventDetail>(`/events/organizer/${id}/`);
    return res.data;
  },

  async createOrganizerEvent(data: CreateEventFormData): Promise<OrganizerEventDetail> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'ticket_tiers') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'banner' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const res = await api.post<OrganizerEventDetail>('/events/organizer/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async updateOrganizerEvent(id: number, data: Partial<CreateEventFormData>): Promise<OrganizerEventDetail> {
    const res = await api.patch<OrganizerEventDetail>(`/events/organizer/${id}/`, data);
    return res.data;
  },

  async deleteOrganizerEvent(id: number): Promise<void> {
    await api.delete(`/events/organizer/${id}/`);
  },

  async submitEventForReview(id: number): Promise<OrganizerEventDetail> {
    const res = await api.post<OrganizerEventDetail>(`/events/organizer/${id}/submit/`);
    return res.data;
  },

  async listTicketTiers(eventId: number): Promise<TicketTier[]> {
    const res = await api.get<TicketTier[]>(`/events/organizer/${eventId}/tiers/`);
    return res.data;
  },

  async createTicketTier(eventId: number, data: TicketTierInputData): Promise<TicketTier> {
    const res = await api.post<TicketTier>(`/events/organizer/${eventId}/tiers/`, data);
    return res.data;
  },

  async updateTicketTier(eventId: number, tierId: number, data: Partial<TicketTierInputData>): Promise<TicketTier> {
    const res = await api.patch<TicketTier>(`/events/organizer/${eventId}/tiers/${tierId}/`, data);
    return res.data;
  },

  async deleteTicketTier(eventId: number, tierId: number): Promise<void> {
    await api.delete(`/events/organizer/${eventId}/tiers/${tierId}/`);
  },

  // Admin endpoints
  async listPendingEvents(): Promise<AdminEventReview[]> {
    const res = await api.get<AdminEventReview[]>('/admin/events/pending/');
    return res.data;
  },

  async getAdminEventDetail(id: number): Promise<AdminEventDetail> {
    const res = await api.get<AdminEventDetail>(`/admin/events/${id}/`);
    return res.data;
  },

  async approveOrRejectEvent(id: number, data: ApprovalActionFormData): Promise<AdminEventReview> {
    const res = await api.post<AdminEventReview>(`/admin/events/${id}/approve/`, data);
    return res.data;
  },

  async publishEvent(id: number): Promise<AdminEventReview> {
    const res = await api.post<AdminEventReview>(`/admin/events/${id}/publish/`);
    return res.data;
  },
};
