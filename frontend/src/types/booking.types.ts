import { Status390Enum, TicketStatusEnum, ProviderEnum } from './common.types';

export interface BookingItemInputRequest {
  ticket_tier: number;
  quantity: number;
}

export interface BookingCreateRequest {
  event: number;
  items: BookingItemInputRequest[];
}

export interface BookingItem {
  id: number;
  ticket_tier: number;
  ticket_tier_name: string;
  quantity: number;
  price_at_purchase: string;
  subtotal: string;
}

export interface BookingList {
  id: number;
  event: number;
  event_title: string;
  event_start_datetime: string;
  status: Status390Enum;
  total_amount: string;
  items: BookingItem[];
  created_at: string;
}

export interface BookingDetail extends BookingList {
  event_venue: string;
  cancelled_at: string | null;
  updated_at: string;
}

export interface PaymentInitiateRequest {
  provider: ProviderEnum;
}

export interface PaymentInitiateResponse {
  payment_url?: string;
  pidx?: string;
  params?: Record<string, string>;
  [key: string]: unknown;
}

export interface PaymentVerifyRequest {
  provider: ProviderEnum;
  pidx?: string;
}

export interface Ticket {
  id: string; // UUID
  booking_id: number;
  booking_item: BookingItem;
  attendee_name: string;
  attendee_email: string;
  status: TicketStatusEnum;
  status_display: string;
  qr_code_payload?: string;
  qr_code_image?: string | null;
  event_title?: string;
  event_start_datetime?: string;
  event_end_datetime?: string;
  event_venue?: string;
  event_address?: string;
  event_city?: string;
  checked_in_at?: string | null;
  created_at: string;
  booked_at?: string;
}

export interface TicketSummary {
  ticket_id: string;
  event_title: string;
  event_date_time: string;
  event_location: string;
  seat_or_tier: string;
  status: string;
}
