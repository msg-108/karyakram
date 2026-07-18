/**
 * api/events.ts — wrappers for every events-app endpoint.
 *
 * Endpoints confirmed against apps/events/urls.py (mounted at api/events/):
 *   GET    events/                          public list (paginated)
 *   GET    events/<slug>/                   public detail
 *   GET    categories/                      bare array (pagination_class=None)
 *   GET    organizer/events/                organizer's own events list
 *   POST   organizer/events/                create event (DRAFT)
 *   GET    organizer/events/<pk>/           organizer event detail
 *   PATCH  organizer/events/<pk>/           update event
 *   DELETE organizer/events/<pk>/           delete event
 *   POST   organizer/events/<pk>/submit/    submit for review
 *   GET    organizer/events/<pk>/tiers/     list tiers
 *   POST   organizer/events/<pk>/tiers/     create tier
 *   PATCH  organizer/ticket-tiers/<pk>/     update tier
 *   DELETE organizer/ticket-tiers/<pk>/     delete tier
 *   POST   organizer/events/<pk>/images/    upload gallery image
 *   GET    admin/events/pending/            admin review queue
 *   POST   admin/events/<pk>/approve/       approve or reject
 *   POST   admin/events/<pk>/publish/       publish approved event
 */
import client from './client'
import type { PaginatedResponse, EventListItem, EventDetail, EventCategory, OrganizerEventListItem, OrganizerEventDetail, TicketTier, AdminEventReview, EventApprovalPayload } from '../types/events'

// ── Public ──────────────────────────────────

export const listPublicEvents = (params?: {
  q?: string
  category?: string
  city?: string
  start_date_from?: string
  start_date_to?: string
  page?: number
}) => client.get<PaginatedResponse<EventListItem>>('/events/events/', { params })

export const getPublicEvent = (slug: string) =>
  client.get<EventDetail>(`/events/events/${slug}/`)

/** categories/ returns a bare array — pagination_class = None in the view */
export const listCategories = () =>
  client.get<EventCategory[]>('/events/categories/')

// ── Organizer ────────────────────────────────

export const listOrganizerEvents = () =>
  client.get<OrganizerEventListItem[]>('/events/organizer/events/')

export const createEvent = (data: Record<string, unknown>) =>
  client.post<OrganizerEventDetail>('/events/organizer/events/', data)

export const getOrganizerEvent = (pk: number) =>
  client.get<OrganizerEventDetail>(`/events/organizer/events/${pk}/`)

export const updateEvent = (pk: number, data: FormData | Record<string, unknown>) =>
  client.patch<OrganizerEventDetail>(`/events/organizer/events/${pk}/`, data)

export const deleteEvent = (pk: number) =>
  client.delete(`/events/organizer/events/${pk}/`)

export const submitEvent = (pk: number) =>
  client.post<OrganizerEventDetail>(`/events/organizer/events/${pk}/submit/`)

export const listTiers = (eventPk: number) =>
  client.get<TicketTier[]>(`/events/organizer/events/${eventPk}/tiers/`)

export const createTier = (eventPk: number, data: Partial<TicketTier>) =>
  client.post<TicketTier>(`/events/organizer/events/${eventPk}/tiers/`, data)

export const updateTier = (tierPk: number, data: Partial<TicketTier>) =>
  client.patch<TicketTier>(`/events/organizer/ticket-tiers/${tierPk}/`, data)

export const deleteTier = (tierPk: number) =>
  client.delete(`/events/organizer/ticket-tiers/${tierPk}/`)

export const uploadEventImage = (eventPk: number, data: FormData) =>
  client.post(`/events/organizer/events/${eventPk}/images/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Admin ────────────────────────────────────

export const listPendingEvents = () =>
  client.get<AdminEventReview[]>('/events/admin/events/pending/')

export const approveOrRejectEvent = (pk: number, payload: EventApprovalPayload) =>
  client.post<AdminEventReview>(`/events/admin/events/${pk}/approve/`, payload)

export const publishEvent = (pk: number) =>
  client.post<AdminEventReview>(`/events/admin/events/${pk}/publish/`)
