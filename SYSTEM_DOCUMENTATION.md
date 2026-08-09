# Karyakram — Technical System Documentation

**Project Name:** Karyakram (Event Management & Ticket Booking Platform)  
**Document Version:** 2.0 (Final Release)  
**Date:** August 2026  

---

## 1. Executive System Overview

**Karyakram** is a high-performance, full-stack event management and digital ticketing platform designed specifically for the Nepalese market. The application bridges the gap between event organizers and attendees by replacing manual spreadsheet-driven workflows with a real-time, automated web application.

### Key Capabilities
- **Multi-Role Access Control (RBAC):** Attendees, Organizers (with admin verification workflow), and System Administrators.
- **Atomic Booking Engine:** Hold-based seat reservations (10-minute hold window) with zero overselling guarantees using database-level pessimistic locking (`select_for_update`).
- **Nepal Payment Gateway Integration:** eSewa epay v2 integration with HMAC-SHA256 signature generation and server-to-server transaction reconciliation.
- **Low-Density QR Ticket Engine:** Ultra-compact JWT-signed QR passes optimized for low-light venue scanner cameras (25x25 grid Version 2 QR codes).
- **Asynchronous Email Pipeline:** HTML email delivery for OTP verification, booking receipts, and inline Base64 QR code ticket passes.
- **Analytics & Reporting:** Organizer and Admin dashboards featuring revenue metrics, ticket sales charts, and attendee check-in progress.

---

## 2. Technology Stack & Component Architecture

### Backend Architecture
- **Framework:** Django 5.x & Django REST Framework (DRF)
- **Language:** Python 3.14
- **Database:** PostgreSQL (with ACID compliant relational transactions)
- **Task Queue & Async Jobs:** Celery + Redis (with synchronous eager fallback mode `CELERY_TASK_ALWAYS_EAGER`)
- **Authentication:** JSON Web Tokens (JWT via `rest_framework_simplejwt`) & Email OTP Verification
- **API Documentation:** OpenAPI 3.0 via `drf-spectacular` & Swagger UI

### Frontend Architecture
- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite 8.x
- **Styling:** Vanilla CSS & TailwindCSS (custom design system with glassmorphism and modern color tokens)
- **State & Data Fetching:** `@tanstack/react-query` v5 for query caching, automatic refetching, and optimistic mutations
- **Icons:** `lucide-react`
- **QR Generator & Camera Scanner:** `qrcode.react` (Frontend SVG rendering) & `@html5-qrcode` (Live browser camera check-in scanner)

---

## 3. Core Modules & Responsibilities

| Module | Core Responsibilities | Key Files |
| :--- | :--- | :--- |
| **`apps.users`** | User registration, role management (ATTENDEE, ORGANIZER, ADMIN), OTP email verification, JWT auth, profile management, and organizer approval request workflow. | [`models.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/users/models.py), [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/users/services.py) |
| **`apps.events`** | Event creation, editing, category assignment, multi-tier ticket setup, image uploads, organizer approval submission, admin approval/rejection. | [`models.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/events/models.py), [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/events/services.py) |
| **`apps.bookings`** | 10-minute hold reservation, atomic inventory deduction, booking status state machine (PENDING $\rightarrow$ CONFIRMED / CANCELLED / EXPIRED), hold expiration cleanup task. | [`models.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/bookings/models.py), [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/bookings/services.py) |
| **`apps.payments`** | eSewa epay v2 form generation, HMAC-SHA256 signature compute, payment status verification query (`/api/epay/main/v2/decodedated`), background payment auto-reconciliation. | [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/payments/services.py), [`views.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/payments/views.py) |
| **`apps.tickets`** | Compact JWT QR payload generation, digital ticket issuance, inline Base64 email delivery, organizer QR scanner validation & single-use atomic check-in. | [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/tickets/services.py), [`views.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/tickets/views.py) |
| **`apps.dashboard`** | Organizer revenue analytics, ticket sales timelines, check-in percentages, user booking & ticket summary feeds. | [`services.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/dashboard/services.py), [`views.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/dashboard/views.py) |
| **`apps.common`** | HTML/Plain-text email templating system, Base64 image attachment logic, shared permission classes (`IsOrganizer`, `IsAdmin`). | [`email.py`](file:///wsl.localhost/Ubuntu/home/loq/karyakram/backend/apps/common/email.py) |

---

## 4. Deep-Dive Technical Implementations

### A. Concurrency & Race Condition Prevention
When multiple users attempt to purchase tickets for high-demand events simultaneously, inventory overbooking must be strictly prevented.

1. **Pessimistic Row Locking:**  
   During ticket booking (`create_booking`), the system locks the relevant `TicketTier` records using Django's `select_for_update()` inside an `transaction.atomic()` block:
   ```python
   tiers = TicketTier.objects.select_for_update().filter(id__in=tier_ids)
   ```
2. **Hold Expiration Window:**  
   When a booking is initiated, inventory is immediately decremented from `remaining_quantity`, and a 10-minute hold expiration timestamp (`hold_expires_at`) is stamped.
3. **Background Release & Auto-Reconciliation:**  
   A background Celery task (`cancel_expired_bookings_task`) periodically scans for expired pending bookings (`status=PENDING` and `hold_expires_at < now`). Before cancelling, it queries eSewa's transaction status endpoint. If unpaid, the booking status transitions to `EXPIRED`, and reserved quantities are atomically added back to `remaining_quantity`.

### B. Ultra-Compact QR Code TOTP/JWT Engine
Standard JWT tokens contain long claim names (`"ticket_id"`, `"event_id"`), resulting in dense Version 4 QR codes (33x33 matrix) that suffer high scan failure rates under poor mobile camera lighting.

1. **Claim Key Shortening:**  
   The QR payload serializer uses micro-keys:
   - `"t"`: Ticket UUID (`str`)
   - `"e"`: Event ID (`int`)
   - `"exp"`: Expiration Unix Timestamp (`int`)
2. **Matrix Optimization:**  
   Using Error Correction Level `M` (15% recovery) and Version 2 encoding (25x25 spacious matrix with large blocks), the physical QR code becomes drastically easier to scan from smartphone screens.
3. **Inline Email Embedding:**  
   Tickets delivered via email embed the QR PNG directly into the HTML body as a Base64 Data URI (`data:image/png;base64,...`), bypassing external image hosting blocking in modern email clients.

### C. Edge Cases & Robustness Handling
- **eSewa Sandbox Guard:** The eSewa verification service enforces `allow_sandbox_fallback=False` during background expiration tasks. This prevents unpaid test holds from accidentally auto-completing during background reconciliation runs.
- **Synchronous Email Fallback:** If Celery worker processes are offline in local development, `send_email` automatically invokes `_send_email_direct` to guarantee immediate email delivery.
- **Un-paginated API Protection:** Front-end pagination components auto-reset to `page = 1` if an out-of-bounds page request returns a 404 response.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Python 3.11+ (Python 3.14 supported)
- Node.js 18+ & npm
- PostgreSQL database

### Backend Setup
1. Clone the repository and navigate to backend:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/WSL
   # or .venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```env
   DEBUG=True
   SECRET_KEY=your_django_secret_key
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/karyakram_db
   ESEWA_MERCHANT_CODE=EPAYTEST
   ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
   FRONTEND_URL=http://localhost:5173
   ```
5. Apply database migrations and run dev server:
   ```bash
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend Setup
1. Open a new terminal and navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in browser at `http://localhost:5173`.

---

## 6. API Postman Testing Guide & Endpoint Reference

### Step 1: User Registration & OTP Verification
- **POST** `/api/users/register/`
  - **Body (JSON):**
    ```json
    {
      "email": "testuser@example.com",
      "username": "testuser",
      "password": "Password123!",
      "first_name": "Test",
      "last_name": "User",
      "role": "ATTENDEE"
    }
    ```
- **POST** `/api/users/verify-email/`
  - **Body (JSON):**
    ```json
    {
      "email": "testuser@example.com",
      "code": "123456"
    }
    ```

### Step 2: Login & Obtain JWT Token
- **POST** `/api/users/login/`
  - **Body (JSON):**
    ```json
    {
      "email": "testuser@example.com",
      "password": "Password123!"
    }
    ```
  - **Response:**
    ```json
    {
      "access": "<JWT_ACCESS_TOKEN>",
      "refresh": "<JWT_REFRESH_TOKEN>"
    }
    ```
  - *Postman setup:* Copy `<JWT_ACCESS_TOKEN>` and set as Bearer Token in Authorization header for subsequent requests (`Authorization: Bearer <JWT_ACCESS_TOKEN>`).

### Step 3: Create Booking (10-Minute Hold)
- **POST** `/api/bookings/`
  - **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - **Body (JSON):**
    ```json
    {
      "event": 1,
      "items": [
        {
          "ticket_tier": 1,
          "quantity": 2
        }
      ]
    }
    ```

### Step 4: Initiate eSewa Payment
- **POST** `/api/bookings/<booking_id>/payment/initiate/`
  - **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - **Body (JSON):**
    ```json
    {
      "provider": "ESEWA"
    }
    ```
  - **Response:** Returns form payload with HMAC signature `signature` and payment redirect URL (`https://rc-epay.esewa.com.np/api/epay/main/v2/form`).

### Step 5: Verify eSewa Payment
- **POST** `/api/bookings/<booking_id>/payment/verify/`
  - **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - **Body (JSON):**
    ```json
    {
      "provider": "ESEWA",
      "pidx": "ENCODED_ESEWA_RESPONSE_DATA"
    }
    ```
  - **Result:** Booking status becomes `CONFIRMED`, digital tickets are generated, and Base64 QR email is delivered!
