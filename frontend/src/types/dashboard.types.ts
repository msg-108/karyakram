import { StatusDd4Enum } from './common.types';
import { UserPublic, OrganizerProfile } from './auth.types';
import { EventCategory } from './event.types';

export interface UserProfileSummary {
  user: UserPublic;
  upcoming_ticket_count: number;
  total_ticket_count: number;
  unread_notification_count: number;
}

export interface OrganizerProfileSummary {
  profile: OrganizerProfile;
  total_events: number;
  upcoming_events: number;
  unread_notification_count: number;
}

export interface EventSummary {
  event_id: number;
  title: string;
  date_time: string;
  location: string;
  organizer_name: string;
}

export interface OrderSummary {
  order_id: number;
  buyer_name: string;
  event_name: string;
  amount: string;
  placed_at: string;
  status: string;
}

export interface AttendeeSummary {
  attendee_name: string;
  email: string;
  ticket_status: string;
  checked_in: boolean;
}

export interface EventStatistics {
  total_events: number;
  total_tickets_sold: number;
  total_attendees_checked_in: number;
}

export interface TicketSalesSummary {
  total_sold: number;
  total_available: number;
}

export interface RevenueByMonth {
  label: string;
  amount: string;
}

export interface RevenueAnalytics {
  total_revenue: string;
  currency: string;
  by_month: RevenueByMonth[];
}

export interface CheckInStatistics {
  total_checked_in: number;
  total_expected: number;
}

export interface QRScanStatistics {
  total_scans: number;
  valid_scans: number;
  invalid_scans: number;
}

export interface ActivityItem {
  occurred_at: string;
  description: string;
}

export interface PaymentSummary {
  payment_id: number;
  amount: string;
  currency: string;
  status: string;
  paid_at: string | null;
  event_name: string;
}

export interface NotificationSummary {
  notification_id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface AdminEventReview {
  id: number;
  slug: string;
  title: string;
  category: EventCategory;
  organizer_name: string;
  status: StatusDd4Enum;
  start_datetime: string;
  end_datetime: string;
  approved_by_username: string;
  approved_at: string | null;
  rejection_reason: string;
  created_at: string;
}
