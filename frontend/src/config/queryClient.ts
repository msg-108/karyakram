import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2 minutes default
      gcTime: 10 * 60 * 1000,           // 10 min garbage collection
      retry: 1,                          // Retry once on failure
      refetchOnWindowFocus: false,       // Don't surprise the user
      refetchOnReconnect: true,          // Do refetch when network returns
    },
    mutations: {
      retry: 0,                          // Never auto-retry mutations
    },
  },
});

/**
 * Query key factory for consistent cache management.
 * Usage: queryKeys.events.list(params) or queryKeys.bookings.detail(id)
 */
export const queryKeys = {
  // Auth & Profile
  auth: {
    me: () => ['auth', 'me'] as const,
    organizerProfile: () => ['auth', 'organizer-profile'] as const,
  },

  // Public events
  events: {
    all: () => ['events'] as const,
    list: (params?: Record<string, unknown>) => ['events', 'list', params] as const,
    detail: (slug: string) => ['events', 'detail', slug] as const,
    categories: () => ['events', 'categories'] as const,
  },

  // Bookings
  bookings: {
    all: () => ['bookings'] as const,
    list: (page?: number) => ['bookings', 'list', page] as const,
    detail: (id: number) => ['bookings', 'detail', id] as const,
  },

  // Tickets
  tickets: {
    all: () => ['tickets'] as const,
    mine: (page?: number) => ['tickets', 'mine', page] as const,
    upcoming: () => ['tickets', 'upcoming'] as const,
    history: () => ['tickets', 'history'] as const,
  },

  // Organizer
  organizer: {
    summary: () => ['organizer', 'summary'] as const,
    events: () => ['organizer', 'events'] as const,
    eventDetail: (id: number) => ['organizer', 'events', id] as const,
    eventTiers: (id: number) => ['organizer', 'events', id, 'tiers'] as const,
    eventImages: (id: number) => ['organizer', 'events', id, 'images'] as const,
    eventAttendees: (eventId: number) => ['organizer', 'events', eventId, 'attendees'] as const,
    upcomingEvents: () => ['organizer', 'upcoming-events'] as const,
    recentOrders: () => ['organizer', 'recent-orders'] as const,
    stats: {
      events: () => ['organizer', 'stats', 'events'] as const,
      tickets: () => ['organizer', 'stats', 'tickets'] as const,
      revenue: () => ['organizer', 'stats', 'revenue'] as const,
      checkIns: () => ['organizer', 'stats', 'checkins'] as const,
      qrScans: () => ['organizer', 'stats', 'qr-scans'] as const,
    },
  },

  // User dashboard
  user: {
    summary: () => ['user', 'summary'] as const,
    upcomingEvents: () => ['user', 'upcoming-events'] as const,
    paymentHistory: () => ['user', 'payments'] as const,
    recentActivity: () => ['user', 'activity'] as const,
  },

  // Admin
  admin: {
    pendingOrganizers: () => ['admin', 'pending-organizers'] as const,
    pendingEvents: () => ['admin', 'pending-events'] as const,
  },

  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
  },
} as const;
