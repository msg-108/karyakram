// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

/**
 * DRF PageNumberPagination wrapper — all list endpoints except categories/
 * return this shape (PAGE_SIZE=20 in settings).
 * categories/ explicitly sets pagination_class = None so it returns a bare array.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────

/** Mirrors EventCategorySerializer */
export interface EventCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Ticket Tiers
// ─────────────────────────────────────────────

/**
 * Mirrors TicketTierSerializer.
 * remaining_quantity is read-only (set by service on creation, decremented by bookings).
 * display_order controls rendering order on the event detail page.
 */
export interface TicketTier {
  id: number;
  event: number;
  name: string;
  description: string;
  price: string;           // DecimalField → string from DRF
  quantity: number;
  remaining_quantity: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input for creating a tier inline (on event creation) — mirrors TicketTierCreateInputSerializer */
export interface TicketTierCreateInput {
  name: string;
  description?: string;
  price: string;
  quantity: number;
  display_order?: number;
  is_active?: boolean;
}

// ─────────────────────────────────────────────
// Gallery Images
// ─────────────────────────────────────────────

/** Mirrors EventImageSerializer */
export interface EventImage {
  id: number;
  event: number;
  image: string;
  caption: string;
  display_order: number;
  created_at: string;
}

// ─────────────────────────────────────────────
// Events: Public
// ─────────────────────────────────────────────

/**
 * Mirrors PublicEventListSerializer — compact shape for list/search results.
 * Omits description, terms_and_conditions, gallery, tiers.
 */
export interface EventListItem {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  category: EventCategory;
  organizer_name: string;
  venue: string;
  city: string;
  banner: string | null;
  start_datetime: string;
  end_datetime: string;
}

/** Mirrors PublicEventDetailSerializer — full public detail including tiers and gallery */
export interface EventDetail {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  terms_and_conditions: string;
  category: EventCategory;
  organizer_name: string;
  venue: string;
  address: string;
  city: string;
  district: string;
  province: string;
  latitude: string | null;
  longitude: string | null;
  banner: string | null;
  start_datetime: string;
  end_datetime: string;
  registration_deadline: string | null;
  capacity: number;
  gallery_images: EventImage[];
  ticket_tiers: TicketTier[];
}

// ─────────────────────────────────────────────
// Events: Organizer
// ─────────────────────────────────────────────

/**
 * Event status — matches Event.Status choices (uppercase).
 * DRAFT → SUBMITTED → APPROVED → PUBLISHED (or REJECTED back to DRAFT)
 */
export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

/** Mirrors OrganizerEventListSerializer */
export interface OrganizerEventListItem {
  id: number;
  slug: string;
  title: string;
  category: EventCategory;
  status: EventStatus;
  visibility: EventVisibility;
  start_datetime: string;
  end_datetime: string;
  rejection_reason: string | null;
}

/** Mirrors OrganizerEventDetailSerializer */
export interface OrganizerEventDetail {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  terms_and_conditions: string;
  category: EventCategory;
  venue: string;
  address: string;
  city: string;
  district: string;
  province: string;
  latitude: string | null;
  longitude: string | null;
  banner: string | null;
  start_datetime: string;
  end_datetime: string;
  registration_deadline: string | null;
  capacity: number;
  visibility: EventVisibility;
  status: EventStatus;
  rejection_reason: string | null;
  published_at: string | null;
  gallery_images: EventImage[];
  ticket_tiers: TicketTier[];
  created_at: string;
  updated_at: string;
}

/** Mirrors OrganizerEventWriteSerializer input fields */
export interface OrganizerEventWritePayload {
  title: string;
  short_description: string;
  description: string;
  terms_and_conditions?: string;
  category: number;
  venue: string;
  address: string;
  city: string;
  district: string;
  province: string;
  latitude?: string;
  longitude?: string;
  banner?: File;
  start_datetime: string;
  end_datetime: string;
  registration_deadline?: string;
  capacity: number;
  visibility?: EventVisibility;
  ticket_tiers?: TicketTierCreateInput[];
}

// ─────────────────────────────────────────────
// Events: Admin review
// ─────────────────────────────────────────────

/** Mirrors AdminEventReviewSerializer */
export interface AdminEventReview {
  id: number;
  slug: string;
  title: string;
  category: EventCategory;
  organizer_name: string;
  status: EventStatus;
  start_datetime: string;
  end_datetime: string;
  approved_by_username: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

/** POST /api/events/admin/events/<pk>/approve/ body */
export interface EventApprovalPayload {
  action: 'approve' | 'reject';
  reason?: string;
}
