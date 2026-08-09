# Karyakram — System Architecture

*Version 2.0 — Final Release — August 2026*

---

## 1. High-Level Architecture

Karyakram follows a **clean service-oriented architecture** across two independently deployable applications:

- **Backend:** Django REST Framework API server
- **Frontend:** React 18 + TypeScript single-page application

```
Browser (React SPA)
        │
        │  HTTP / JWT Bearer Token
        ▼
Django REST Framework (DRF) API
        │
   ┌────┴────────────────────────────┐
   │                                 │
   ▼                                 ▼
PostgreSQL DB              Celery + Redis
(Primary Store)         (Background Tasks)
                                     │
                         ┌───────────┴───────────┐
                         ▼                       ▼
                   SMTP Email             eSewa Gateway
                   (HTML Passes)         (epay v2 HMAC)
```

---

## 2. Design Principles

### 2.1 Thin Views — Service-Oriented Logic
DRF views contain **zero business logic**. Their sole responsibilities are:
1. Parsing and validating incoming request data via serializers.
2. Delegating to a `services.py` function.
3. Returning the serialized response.

All multi-model state changes, locking, email triggers, and payment orchestration live in `services.py`.

### 2.2 Exception-Driven Flow Control
Service functions raise DRF's standard exceptions (`ValidationError`, `PermissionDenied`, `NotFound`) on failure. Views allow these to bubble up to DRF's default exception handler — no manual HTTP response crafting, no duplicated error code boilerplate.

### 2.3 Asynchronous Execution (Celery + Redis)
Long-running or IO-bound work is offloaded to Celery background workers:
- **Email delivery** — OTP codes, booking confirmations, QR ticket passes
- **QR image generation** — PNG rendering of ticket QR codes
- **Hold expiration sweep** — Celery Beat cron runs every 5 minutes, expires unpaid holds, and reconciles payment status with eSewa server-to-server API

> **Development shortcut:** Setting `CELERY_TASK_ALWAYS_EAGER=True` in `development.py` executes all tasks synchronously in-process, so a separate Celery worker process is not needed during local development.

### 2.4 Atomicity & Concurrency Control
The booking system operates under high concurrency. The `create_booking` service guarantees zero overselling via:

1. **`@transaction.atomic`** — All `TicketTier` quantity deductions and `Booking` record creation happen in a single atomic database transaction.
2. **`select_for_update()`** — Explicit pessimistic row-level lock placed on each `TicketTier` row before reading `remaining_quantity`.
3. **Sorted lock acquisition** — Tiers are sorted ascending by primary key before locking, preventing circular deadlocks between concurrent transactions.

```python
# Simplified booking lock pattern
with transaction.atomic():
    tiers = TicketTier.objects.select_for_update().filter(
        id__in=tier_ids
    ).order_by("id")
    # Deduct remaining_quantity — guaranteed exclusive access
```

---

## 3. Django App Boundaries

| App | Responsibility | Key Models |
|-----|---------------|------------|
| `apps.users` | User accounts, OTP verification, JWT auth, role management, organizer profile approval state machine | `User`, `OrganizerProfile` |
| `apps.events` | Event lifecycle, multi-tier pricing, image attachments, category taxonomy | `Event`, `TicketTier`, `EventCategory`, `EventImage` |
| `apps.bookings` | Ticket reservation, 10-min hold timer, booking status state machine, cancellation/seat restore | `Booking`, `BookingItem` |
| `apps.payments` | Payment initiation, eSewa HMAC-SHA256 signature, server-to-server verification, auto-reconciliation | `Payment` |
| `apps.tickets` | Compact JWT QR generation, Base64 email embedding, single-use check-in atomic state machine | `Ticket` |
| `apps.dashboard` | Analytics aggregation — revenue, ticket sales, check-in rates for organizer & admin | (No models — query layer only) |
| `apps.common` | Shared email engine (`send_email`, `_send_email_direct` fallback), shared permission classes | (No models) |

---

## 4. Booking State Machine

```
[POST /api/bookings/]
         │
         ▼
    [PENDING] ──── hold_expires_at stamped
         │
    ┌────┴─────────────────┬───────────────────────┐
    │                      │                       │
    ▼                      ▼                       ▼
[CONFIRMED]           [CANCELLED]            [EXPIRED]
(eSewa verified)   (user cancelled)    (hold expired, unpaid)
         │
         ▼
   Tickets Issued
   QR Email Sent
```

---

## 5. QR Ticket Architecture

### Generation
1. On booking confirmation, `generate_tickets_for_booking()` creates one `Ticket` record per quantity per tier.
2. For each ticket, `generate_qr_jwt(ticket)` signs a compact JWT payload:
   ```json
   { "t": "<uuid>", "e": <event_id>, "exp": <unix_timestamp> }
   ```
3. `generate_qr_image()` renders a **Version 2, 25×25 matrix, 500×500px PNG** (`box_size=16`, `border=2`, `ERROR_CORRECT_M`).
4. The PNG is Base64-encoded and embedded inline into the HTML email body as a Data URI.

### Validation (Organizer Scanner)
1. Organizer opens `/organizer/check-in` page — browser activates device camera.
2. `@html5-qrcode` decodes the QR string from the live video feed.
3. The scanned JWT string is `POST`ed to `/api/events/{event_id}/check-in/`.
4. Backend atomically:
   - Verifies JWT signature with `SECRET_KEY`.
   - Confirms `ticket.event == event_id` (cross-event fraud prevention).
   - Checks `ticket.status == VALID` (rejects duplicate scans).
   - Sets `ticket.status = CHECKED_IN` and stamps `checked_in_at = now()`.

---

## 6. Payment Flow (eSewa epay v2)

```
Attendee browser                  Karyakram Backend              eSewa
      │                                   │                         │
      │  POST /payment/initiate/          │                         │
      │──────────────────────────────────►│                         │
      │                                   │  Compute HMAC-SHA256    │
      │  { params, signature, pay_url }   │  signature              │
      │◄──────────────────────────────────│                         │
      │                                   │                         │
      │  Redirect to eSewa form ──────────────────────────────────►│
      │                                   │                         │
      │  eSewa redirects back with        │                         │
      │  encoded `data` param ◄───────────────────────────────────│
      │                                   │                         │
      │  POST /payment/verify/            │                         │
      │──────────────────────────────────►│                         │
      │                                   │  GET /decodedated/ ────►│
      │                                   │  Verify txn status      │
      │                                   │◄────────────────────────│
      │  { status: CONFIRMED }            │                         │
      │◄──────────────────────────────────│                         │
```

---

## 7. Email System

| Email | Template | Trigger |
|-------|----------|---------|
| OTP Verification | `emails/otp_email` | User registration |
| Booking Hold Notice | `emails/booking_created` | `create_booking()` |
| Booking Confirmed + QR Tickets | `emails/booking_confirmed` + `emails/tickets_delivered` | `confirm_booking()` after payment verified |
| Booking Cancelled | `emails/booking_cancelled` | `cancel_booking()` |
| Organizer New Sale Alert | `emails/organizer_booking_alert` | `confirm_booking()` |

**Email Fallback:** If Celery dispatch fails, `send_email()` automatically invokes `_send_email_direct()` for synchronous in-process delivery.

---

## 8. Data Model Overview (ER Summary)

```
[User] 1 ─────────── 1 [OrganizerProfile]
  │                             │
  │                             * (organizer)
  *                          [Event] 1 ─── * [TicketTier]
[Booking] * ──────── 1 [Event]     │
  │                             * [EventImage]
  * [BookingItem] * ── 1 [TicketTier]
  │
  1 [Payment]
  │
  * [Ticket] ── 1 [BookingItem]
```

---

## 9. Testing Strategy

- **Backend:** Django's built-in `TestCase` + `TransactionTestCase` (for row-lock tests)
- **Test Database:** PostgreSQL (matches production — SQLite cannot test `select_for_update`)
- **Coverage:** 31 automated unit tests covering auth, events, bookings, payments, and tickets
- **Run tests:**
  ```bash
  cd backend
  python manage.py test apps.users.tests apps.events.tests apps.bookings.tests apps.payments.tests apps.tickets.tests
  ```
