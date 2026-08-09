# Karyakram Frontend

React 18 + TypeScript single-page application for the Karyakram event management and ticket booking platform.

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Dev server at http://localhost:5173
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Vite dev server with HMR |
| Production build | `npm run build` | TypeScript check + Vite production bundle |
| Preview build | `npm run preview` | Preview production build locally |

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Tech Stack

| Technology | Role |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite 8.x** | Build tool & dev server |
| **@tanstack/react-query v5** | Server state management, caching, background refetch |
| **react-router-dom v6** | Client-side routing |
| **qrcode.react** | QR code SVG generation for ticket display |
| **@html5-qrcode** | Live camera QR scanner for organizer check-in |
| **lucide-react** | Icon library |
| **Custom CSS design system** | Color tokens, glassmorphism, micro-animations |

## Key Pages

| Route | Component | Role |
|-------|-----------|------|
| `/events` | `EventListPage` | Public — browse events |
| `/events/:slug` | `EventDetailPage` | Public — event detail + booking |
| `/dashboard` | `AttendeeDashboard` | Attendee — upcoming tickets stats |
| `/my-bookings` | `MyBookingsPage` | Attendee — booking history (paginated) |
| `/my-tickets` | `MyTicketsPage` | Attendee — digital QR ticket passes |
| `/payment/callback` | `PaymentCallbackPage` | eSewa payment verification & redirect |
| `/organizer/dashboard` | `OrganizerDashboard` | Organizer — revenue & check-in analytics |
| `/organizer/events` | `OrganizerEventsList` | Organizer — manage own events |
| `/organizer/check-in` | `QRScannerPage` | Organizer — live camera check-in scanner |
| `/admin/dashboard` | `AdminDashboard` | Admin — platform overview |

## Project Structure

```
frontend/src/
├── pages/
│   ├── attendee/       # MyBookingsPage, MyTicketsPage, PaymentCallbackPage, AttendeeDashboard
│   ├── organizer/      # OrganizerDashboard, EventsList, QRScannerPage
│   ├── admin/          # AdminDashboard, PendingOrganizers, PendingEvents
│   ├── public/         # EventListPage, EventDetailPage, LandingPage
│   └── auth/           # LoginPage, RegisterPage, OTPVerifyPage
├── components/
│   ├── booking/        # TicketPass, QRDisplay, BookingCard
│   ├── events/         # EventCard, EventFilters, TicketTierSelector
│   ├── layout/         # PublicNavbar, DashboardSidebar, DashboardLayout
│   ├── common/         # Pagination, EmptyState, StatusBadge
│   └── ui/             # Button, Card, Spinner, Input (base UI primitives)
├── hooks/
│   ├── useAuth.ts      # Auth state, login/logout, role checks
│   ├── useBookings.ts  # Booking CRUD, payment mutations, ticket queries
│   └── useEvents.ts    # Event listing, detail, organizer management
├── services/
│   ├── auth.service.ts     # Login, register, OTP, token refresh
│   ├── booking.service.ts  # Bookings, payments, tickets API calls
│   └── event.service.ts    # Public events, organizer events, categories
├── types/
│   ├── booking.types.ts    # Booking, Ticket, Payment interfaces
│   ├── event.types.ts      # Event, TicketTier, EventCategory interfaces
│   └── common.types.ts     # PaginatedResponse, Status enums
└── config/
    ├── queryClient.ts   # @tanstack/react-query client + query key factory
    └── constants.ts     # Session storage keys, app constants
```

See [`../documentation/backend/api_docs.md`](../documentation/backend/api_docs.md) for the full backend API reference.
