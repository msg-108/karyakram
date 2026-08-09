import { StatusDd4Enum, VisibilityEnum } from './common.types';

export interface EventCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketTier {
  id: number;
  event: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  remaining_quantity: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicEventList {
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

export interface PublicEventDetail {
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
  banner: string | null;
  start_datetime: string;
  end_datetime: string;
  registration_deadline: string | null;
  capacity: number;
  ticket_tiers: TicketTier[];
}

export interface OrganizerEventList {
  id: number;
  slug: string;
  title: string;
  category: EventCategory;
  status: StatusDd4Enum;
  visibility: VisibilityEnum;
  start_datetime: string;
  end_datetime: string;
  rejection_reason: string;
}

export interface OrganizerEventDetail extends PublicEventDetail {
  visibility: VisibilityEnum;
  status: StatusDd4Enum;
  rejection_reason: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminEventDetail extends PublicEventDetail {
  organizer_email: string;
  visibility: VisibilityEnum;
  status: StatusDd4Enum;
  approved_by_username: string | null;
  approved_at: string | null;
  rejection_reason: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFilterParams {
  q?: string;
  category?: string;
  city?: string;
  start_date_from?: string;
  start_date_to?: string;
  page?: number;
}
