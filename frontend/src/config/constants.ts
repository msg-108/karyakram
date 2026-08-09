// API & Environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Auth
export const TOKEN_KEY = 'karyakram_refresh_token';

// Booking statuses (from Status390Enum)
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

// Event statuses (from StatusDd4Enum)
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

// Ticket statuses (from TicketStatusEnum)
export const TICKET_STATUS = {
  VALID: 'VALID',
  CHECKED_IN: 'CHECKED_IN',
  CANCELLED: 'CANCELLED',
} as const;

// User roles (from RoleEnum)
export const USER_ROLE = {
  USER: 'USER',
  ORGANIZER: 'ORGANIZER',
} as const;

// Visibility (from VisibilityEnum)
export const VISIBILITY = {
  PUBLIC: 'PUBLIC',
  UNLISTED: 'UNLISTED',
} as const;

// Payment providers (from ProviderEnum)
export const PAYMENT_PROVIDER = {
  ESEWA: 'ESEWA',
  KHALTI: 'KHALTI',
} as const;

// Approval actions (from ActionEnum)
export const APPROVAL_ACTION = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

// Session storage keys
export const SESSION_KEYS = {
  PENDING_BOOKING_ID: 'karyakram_pending_booking',
  PAYMENT_PROVIDER: 'karyakram_payment_provider',
} as const;

// Status colors for badges: Green for success, Orange for error or warning
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT:     { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' },
  SUBMITTED: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' }, // Orange warning
  APPROVED:  { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' }, // Green success
  REJECTED:  { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' }, // Orange error
  PUBLISHED: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' }, // Green success
  ARCHIVED:  { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
  PENDING:   { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' }, // Orange warning
  CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' }, // Green success
  CANCELLED: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' }, // Orange error
  EXPIRED:   { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' }, // Orange error
  VALID:     { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' }, // Green success
  CHECKED_IN:{ bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' }, // Green success
};
