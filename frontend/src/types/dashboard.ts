/**
 * Dashboard types mirror the response shapes of the dashboard app's views.
 * These are inferred from the view/serializer source — the dashboard app
 * does not use dedicated serializers for all endpoints, some build responses
 * directly in the view. Types here reflect what each endpoint actually returns.
 */

// ─────────────────────────────────────────────
// User dashboard
// ─────────────────────────────────────────────

/** GET /api/dashboard/user/summary/ */
export interface UserDashboardSummary {
  total_bookings: number;
  upcoming_events: number;
  total_spent: string;
  recent_bookings?: unknown[];
}

// ─────────────────────────────────────────────
// Organizer dashboard
// ─────────────────────────────────────────────

/** GET /api/dashboard/organizer/summary/ */
export interface OrganizerDashboardSummary {
  total_events: number;
  published_events: number;
  pending_events: number;
  total_revenue: string;
  total_tickets_sold: number;
}
