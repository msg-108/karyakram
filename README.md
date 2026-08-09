# 🎪 Karyakram

**Event Management & Digital Ticket Booking Platform for Nepal**

Karyakram is a production-ready, full-stack web platform that replaces manual spreadsheet-driven event workflows with a real-time, automated system. It supports event discovery, role-based access for attendees/organizers/admins, online booking with inventory locking, eSewa payment integration, and QR-based digital ticket delivery and venue check-in.

---

## ✨ Features

| Role | Capabilities |
|------|-------------|
| **Attendee** | Browse events, book tickets, pay via eSewa, receive QR ticket passes via email, manage bookings & cancellations |
| **Organizer** | Create/manage events with multi-tier pricing, submit for admin approval, QR scanner check-in, revenue analytics |
| **Admin** | Approve/reject organizers & events, oversee platform analytics and all bookings |

### Core Capabilities
- 🔐 **JWT Authentication** with OTP email verification on signup
- 🎫 **Atomic Ticket Booking** — 10-minute hold window with `select_for_update()` preventing overselling
- 💳 **eSewa Payment** — epay v2 with HMAC-SHA256 server-side signature verification
- 📱 **QR Digital Tickets** — Ultra-compact Version 2 (25×25) JWT-signed QR codes delivered inline in email
- 📷 **In-Browser QR Scanner** — Organizer check-in using device camera (`@html5-qrcode`)
- 📊 **Analytics Dashboards** — Revenue, ticket sales, check-in rates for organizers & admin
- 📧 **Automated Emails** — OTP verification, booking holds, booking confirmations, inline QR ticket delivery

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.14 / Django 5.x** | Core web framework |
| **Django REST Framework (DRF)** | RESTful API layer |
| **PostgreSQL** | Primary relational database (ACID transactions) |
| **Celery + Redis** | Background tasks (hold expiration, email dispatch) |
| **SimpleJWT** | JWT access/refresh token management |
| **drf-spectacular** | OpenAPI 3.0 schema & Swagger UI |
| **Pillow** | Event image handling |
| **qrcode** | QR code PNG generation |
| **PyJWT** | QR payload signing & verification |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite 8.x** | Dev server & production build |
| **@tanstack/react-query v5** | Server state, caching, and refetching |
| **qrcode.react** | Frontend QR code SVG rendering |
| **@html5-qrcode** | Live camera scanner for organizer check-in |
| **lucide-react** | Icon library |
| **Vanilla CSS + custom tokens** | Design system with glassmorphism UI |

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+ (3.14 supported)
- Node.js 18+ & npm
- PostgreSQL running locally
- Redis (for Celery task queue)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/karyakram.git
cd karyakram
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux / macOS / WSL
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your DB credentials, secret key, email settings, eSewa keys
```

**Minimum `.env` configuration:**
```env
DEBUG=True
SECRET_KEY=your-django-secret-key-here
DATABASE_URL=postgres://postgres:postgres@localhost:5432/karyakram_db
FRONTEND_URL=http://localhost:5173

# Email (development — console backend)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# eSewa Sandbox
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
```

```bash
# Apply database migrations
python manage.py migrate

# Create a superuser (admin)
python manage.py createsuperuser

# Start API server (Terminal 1)
python manage.py runserver 0.0.0.0:8000

# Start Celery worker + Beat for background tasks (Terminal 2)
celery -A config worker --beat -l INFO
```

> **Note:** In development, `CELERY_TASK_ALWAYS_EAGER=True` runs tasks synchronously — no separate Celery worker required for basic testing.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## 📡 API Reference

| Base URL (Dev) | `http://localhost:8000/api/` |
|---|---|
| **Swagger UI** | `http://localhost:8000/api/docs/` |
| **OpenAPI Schema** | `http://localhost:8000/api/schema/` |
| **Redoc** | `http://localhost:8000/api/redoc/` |

### Key Endpoints

#### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/register/` | Register a new user |
| `POST` | `/api/users/verify-email/` | Verify email with OTP code |
| `POST` | `/api/users/login/` | Login → returns `access` + `refresh` JWT tokens |
| `POST` | `/api/users/token/refresh/` | Refresh access token |
| `GET` | `/api/users/me/` | Get current user profile |

#### Events
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events/` | List published events (paginated, filterable) |
| `GET` | `/api/events/{slug}/` | Event detail with ticket tiers |
| `GET` | `/api/organizer/events/` | Organizer's own events |
| `POST` | `/api/organizer/events/` | Create a new event |
| `POST` | `/api/organizer/events/{id}/submit/` | Submit event for admin review |

#### Booking & Payment
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/bookings/` | Create booking (reserves seats, starts 10-min hold) |
| `GET` | `/api/bookings/` | List user's bookings (paginated) |
| `POST` | `/api/bookings/{id}/payment/initiate/` | Initiate eSewa payment |
| `POST` | `/api/bookings/{id}/payment/verify/` | Verify eSewa payment → confirms booking |
| `POST` | `/api/bookings/{id}/cancel/` | Cancel booking (restores inventory) |

#### Tickets & Check-in
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/me/tickets/` | List user's issued tickets (paginated) |
| `POST` | `/api/events/{id}/check-in/` | Organizer: validate & check-in a QR scanned ticket |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                       │
│              React 18 + TypeScript (Vite 8.x)               │
│        @tanstack/react-query · qrcode.react · html5-qrcode  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JWT Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Django REST Framework API Server               │
│         apps: users · events · bookings · payments          │
│                    tickets · dashboard · common             │
└──────┬──────────────────────┬──────────────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌────────────────┐
│  PostgreSQL │      │ Celery Worker  │──── Redis Queue
│  Database   │      │ (Async Tasks)  │
│  (ACID)     │      │ · hold expiry  │
└─────────────┘      │ · email queue  │
                     └────────────────┘
                             │
              ┌──────────────┴───────────────┐
              ▼                              ▼
     ┌────────────────┐             ┌──────────────────┐
     │  SMTP Server   │             │  eSewa Gateway   │
     │ (Email Passes) │             │  (epay v2 HMAC)  │
     └────────────────┘             └──────────────────┘
```

---

## 👥 User Roles & Permissions

| Role | JWT Claim | Dashboard | Key Permissions |
|------|-----------|-----------|-----------------|
| **Attendee** | `role: "ATTENDEE"` | `/dashboard` | Book tickets, view/cancel bookings, download QR passes |
| **Organizer** | `role: "ORGANIZER"` | `/organizer/dashboard` | Create/manage events, QR check-in scanner, revenue analytics |
| **Admin** | `is_staff: true` | `/admin/dashboard` | Approve organizers/events, view all bookings & platform stats |

---

## 🔒 Concurrency & Race Conditions

Booking tickets is a highly concurrent operation. Karyakram uses multi-layer protection:

1. **Database Row Locks** — `TicketTier.objects.select_for_update()` within `@transaction.atomic` prevents simultaneous overbooking.
2. **Sorted Lock Acquisition** — Locks are always acquired in ascending `id` order to prevent deadlocks between concurrent transactions.
3. **Hold Window** — Confirmed reservations have a 10-minute expiration (`hold_expires_at`). Inventory is only re-released once the hold window expires unpaid.
4. **Background Reconciliation** — Celery Beat sweeps expired holds every 5 minutes, queries eSewa server-to-server for true payment status, then releases unpaid inventory.

---

## 🎟 QR Ticket System

QR passes are JWT-signed tokens with micro-key payload to minimize QR grid density:

```python
# Payload claims
{
  "t": "<ticket-uuid>",   # Ticket ID
  "e": <event-id>,        # Event ID
  "exp": <unix-timestamp> # Expiry
}
```

- **QR Version:** 2 (25×25 matrix) — spacious blocks, fast scanning
- **Error Correction:** Level M (15% recovery capacity)
- **Image Size:** 500×500px PNG (`box_size=16, border=2`)
- **Email Delivery:** Base64-encoded Data URI embedded inline in HTML — no external image hosting needed
- **Check-in:** Single-use atomic DB state machine (`VALID → CHECKED_IN`). Duplicate scans return HTTP 400.

---

## 🧪 Running Tests

```bash
cd backend

# Run all unit tests
python manage.py test apps.users.tests apps.events.tests apps.bookings.tests apps.payments.tests apps.tickets.tests

# Expected: 31 tests, 0 failures, 0 errors
```

---

## 📁 Project Structure

```
karyakram/
├── backend/
│   ├── apps/
│   │   ├── users/          # Auth, OTP, profiles, organizer approval
│   │   ├── events/         # Event CRUD, ticket tiers, categories
│   │   ├── bookings/       # Reservations, hold logic, cancellations
│   │   ├── payments/       # eSewa integration, payment verification
│   │   ├── tickets/        # QR generation, digital passes, check-in
│   │   ├── dashboard/      # Analytics, summaries, reports
│   │   └── common/         # Shared email engine, permissions
│   ├── config/
│   │   └── settings/       # base, development, production
│   └── manage.py
├── frontend/
│   └── src/
│       ├── pages/          # Page-level React components
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React Query hooks
│       ├── services/       # API service functions
│       ├── types/          # TypeScript type definitions
│       └── config/         # Query client, constants
├── documentation/
│   ├── backend/
│   │   ├── api_docs.md         # Complete API documentation
│   │   ├── architecture.md     # System architecture deep-dive
│   │   └── openapi_schema.yaml # OpenAPI 3.0 spec
│   └── diagrams/           # UML diagrams
└── README.md
```

---

## 📜 License

Developed as a minor project for the Bachelor of Engineering in Software Engineering under Pokhara University at Nepal College of Information Technology, Balkumari, Lalitpur.

**Team:**
- Siddhant Chhetri (231644)
- Aman Joshi (231604)
- Madhusudhan Gharti (231620)

**Supervisor:** Er. Manil Vaidhya