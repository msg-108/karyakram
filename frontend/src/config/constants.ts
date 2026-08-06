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

// Status colors for badges
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:     { bg: 'bg-slate-100',      text: 'text-slate-700' },
  SUBMITTED: { bg: 'bg-blue-100',       text: 'text-blue-700' },
  APPROVED:  { bg: 'bg-emerald-100',    text: 'text-emerald-700' },
  REJECTED:  { bg: 'bg-red-100',        text: 'text-red-700' },
  PUBLISHED: { bg: 'bg-green-100',      text: 'text-green-700' },
  ARCHIVED:  { bg: 'bg-gray-100',       text: 'text-gray-700' },
  PENDING:   { bg: 'bg-yellow-100',     text: 'text-yellow-700' },
  CONFIRMED: { bg: 'bg-green-100',      text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100',        text: 'text-red-700' },
  EXPIRED:   { bg: 'bg-gray-100',       text: 'text-gray-500' },
  VALID:     { bg: 'bg-green-100',      text: 'text-green-700' },
  CHECKED_IN:{ bg: 'bg-indigo-100',     text: 'text-indigo-700' },
};
