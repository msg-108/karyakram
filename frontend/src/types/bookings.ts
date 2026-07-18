// ─────────────────────────────────────────────
// Booking status
// ─────────────────────────────────────────────

/** Matches Booking.Status choices (uppercase) */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// ─────────────────────────────────────────────
// Create (input)
// ─────────────────────────────────────────────

/**
 * One line item in the booking create request.
 * Mirrors BookingItemInputSerializer.
 */
export interface BookingItemInput {
  ticket_tier: number;
  quantity: number;
}

/**
 * POST /api/bookings/ body.
 * Mirrors BookingCreateSerializer:
 *   { "event": 1, "items": [{ "ticket_tier": 1, "quantity": 2 }] }
 *
 * Inventory checks (tier belongs to event, remaining_quantity, event is PUBLISHED)
 * happen server-side under a select_for_update lock — not validated here.
 */
export interface BookingCreatePayload {
  event: number;
  items: BookingItemInput[];
}

// ─────────────────────────────────────────────
// Read (output)
// ─────────────────────────────────────────────

/** Mirrors BookingItemSerializer — nested inside list and detail shapes */
export interface BookingItem {
  id: number;
  ticket_tier: number;
  ticket_tier_name: string;
  quantity: number;
  price_at_purchase: string;
  subtotal: string;
}

/** Mirrors BookingListSerializer — compact list shape */
export interface BookingListItem {
  id: number;
  event: number;
  event_title: string;
  event_start_datetime: string;
  status: BookingStatus;
  total_amount: string;
  items: BookingItem[];
  created_at: string;
}

/**
 * Mirrors BookingDetailSerializer — full detail shape.
 * Same fields as list today, kept separate because detail predictably grows
 * (e.g. payment info once BookingPayment is real).
 */
export interface BookingDetail {
  id: number;
  event: number;
  event_title: string;
  event_start_datetime: string;
  event_venue: string;
  status: BookingStatus;
  total_amount: string;
  items: BookingItem[];
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}
