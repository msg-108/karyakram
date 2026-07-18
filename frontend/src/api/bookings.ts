/**
 * api/bookings.ts — wrappers for every bookings-app endpoint.
 *
 * Endpoints confirmed against apps/bookings/urls.py (mounted at api/bookings/):
 *   GET   bookings/           list user's bookings (paginated)
 *   POST  bookings/           create booking
 *   GET   bookings/<pk>/      booking detail
 *   POST  bookings/<pk>/cancel/  cancel booking
 *
 * POST body confirmed from BookingCreateSerializer:
 *   { "event": 1, "items": [{ "ticket_tier": 1, "quantity": 2 }] }
 *
 * Inventory validation (tier belongs to event, remaining_quantity, event is PUBLISHED)
 * is done server-side under a select_for_update lock — not pre-validated on the client.
 */
import client from './client'
import type { BookingListItem, BookingDetail, BookingCreatePayload } from '../types/bookings'
import type { PaginatedResponse } from '../types/events'

export const listBookings = (page?: number) =>
  client.get<PaginatedResponse<BookingListItem>>('/bookings/bookings/', { params: page ? { page } : undefined })

export const createBooking = (payload: BookingCreatePayload) =>
  client.post<BookingDetail>('/bookings/bookings/', payload)

export const getBooking = (pk: number) =>
  client.get<BookingDetail>(`/bookings/bookings/${pk}/`)

export const cancelBooking = (pk: number) =>
  client.post(`/bookings/bookings/${pk}/cancel/`)
