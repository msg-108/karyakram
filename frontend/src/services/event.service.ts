import { api } from '../lib/api';
import {
  EventCategory,
  PublicEventList,
  PublicEventDetail,
  OrganizerEventList,
  OrganizerEventDetail,
  TicketTier,
  EventImage,
  EventFilterParams,
} from '../types/event.types';
import { PaginatedResponse } from '../types/common.types';
import { CreateEventFormData, TicketTierInputData, ApprovalActionFormData } from '../schemas/event.schema';
import { AdminEventReview } from '../types/dashboard.types';

export const eventService = {
  async listCategories(): Promise<EventCategory[]> {
    const res = await api.get<EventCategory[]>('/events/categories/');
    return res.data;
  },

  async listPublicEvents(params?: EventFilterParams): Promise<PaginatedResponse<PublicEventList>> {
    const res = await api.get<PaginatedResponse<PublicEventList>>('/events/events/', { params });
    return res.data;
  },

  async getPublicEvent(slug: string): Promise<PublicEventDetail> {
    const res = await api.get<PublicEventDetail>(`/events/events/${slug}/`);
    return res.data;
  },

  async listOrganizerEvents(): Promise<OrganizerEventList[]> {
    const res = await api.get<OrganizerEventList[]>('/events/organizer/events/');
    return res.data;
  },

  async getOrganizerEvent(id: number): Promise<OrganizerEventDetail> {
    const res = await api.get<OrganizerEventDetail>(`/events/organizer/events/${id}/`);
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

    const res = await api.post<OrganizerEventDetail>('/events/organizer/events/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async updateOrganizerEvent(id: number, data: Partial<CreateEventFormData>): Promise<OrganizerEventDetail> {
    const res = await api.patch<OrganizerEventDetail>(`/events/organizer/events/${id}/`, data);
    return res.data;
  },

  async deleteOrganizerEvent(id: number): Promise<void> {
    await api.delete(`/events/organizer/events/${id}/`);
  },

  async submitEventForReview(id: number): Promise<OrganizerEventDetail> {
    const res = await api.post<OrganizerEventDetail>(`/events/organizer/events/${id}/submit/`);
    return res.data;
  },

  async listTicketTiers(eventId: number): Promise<TicketTier[]> {
    const res = await api.get<TicketTier[]>(`/events/organizer/events/${eventId}/tiers/`);
    return res.data;
  },

  async createTicketTier(eventId: number, data: TicketTierInputData): Promise<TicketTier> {
    const res = await api.post<TicketTier>(`/events/organizer/events/${eventId}/tiers/`, data);
    return res.data;
  },

  async updateTicketTier(tierId: number, data: Partial<TicketTierInputData>): Promise<TicketTier> {
    const res = await api.patch<TicketTier>(`/events/organizer/ticket-tiers/${tierId}/`, data);
    return res.data;
  },

  async deleteTicketTier(tierId: number): Promise<void> {
    await api.delete(`/events/organizer/ticket-tiers/${tierId}/`);
  },

  async listGalleryImages(eventId: number): Promise<EventImage[]> {
    const res = await api.get<EventImage[]>(`/events/organizer/events/${eventId}/images/`);
    return res.data;
  },

  async uploadGalleryImage(eventId: number, file: File, caption?: string): Promise<EventImage> {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);

    const res = await api.post<EventImage>(`/events/organizer/events/${eventId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Admin endpoints
  async listPendingEvents(): Promise<AdminEventReview[]> {
    const res = await api.get<AdminEventReview[]>('/events/admin/events/pending/');
    return res.data;
  },

  async approveOrRejectEvent(id: number, data: ApprovalActionFormData): Promise<AdminEventReview> {
    const res = await api.post<AdminEventReview>(`/events/admin/events/${id}/approve/`, data);
    return res.data;
  },

  async publishEvent(id: number): Promise<AdminEventReview> {
    const res = await api.post<AdminEventReview>(`/events/admin/events/${id}/publish/`);
    return res.data;
  },
};
