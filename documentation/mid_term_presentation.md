# Karyakram — Mid-Term Project Presentation

---

## Slide 1: Project Title
### **Karyakram: A Scalable Event Management and Ticketing Platform**
*Nepal's Unified Platform for Event Discovery, Host Verification, and Secure Ticket Bookings.*

* **Presented by**: Development Team
* **Status**: Mid-Term Review
* **Tech Stack**: React 18, Vite, Tailwind CSS, Django REST Framework, PostgreSQL, SMTP Mailer

---

## Slide 2: Introduction & Problem Statement
### **Why Karyakram?**
* **Market Gaps**: Nepal's event industry suffers from fragmented event discovery, unverified hosts, manual ticket sales, and double-booking risks.
* **Our Solution**: A centralized, monolithic, highly secure event discovery and booking engine featuring:
  * Strict administrative review workflows for hosts and event approvals.
  * Secure, deadlock-free transactional seat/ticket reservation.
  * Immediate automated notifications for account approval, event status, and ticket reservation confirmation.

---

## Slide 3: Core User Personas
### **Three Unified Roles**
1. **Attendee (User)**:
   * Browse published events, select multiple ticket categories, and make secure reservations.
   * View reservation receipts and receive email confirmation tickets.
   * Access dashboard for purchase history and bookings cancellation.
2. **Event Organizer (Host)**:
   * Register with business documents (Citizenship/PAN/Bank information) for admin approval.
   * Manage workspace dashboards (draft events, ticket tier pricing/quantities, and media banners).
   * Edit draft/rejected event configurations and submit them for admin review.
3. **Administrator (Control Panel)**:
   * View pending queues of organizer applications and submitted events.
   * Approve or reject submissions with mandatory reasons.
   * Publish approved events making them instantly visible on the homepage directory.

---

## Slide 4: System Architecture Overview
```
+─────────────────────────────────────────────────────────────+
|                     REACT FRONTEND (Vite)                   |
|  - UI (Navbar, Event Lists, Ticket Checkout, Dashboard)     |
|  - State Management: Zustand (Persistent auth tokens)       |
|  - API client: Axios (Interceptors, Token Refresh)          |
+──────────────────────────────┬──────────────────────────────+
                               │ HTTP REST JSON
+──────────────────────────────▼──────────────────────────────+
|                     DJANGO REST MONOLITH                    |
|  - Router & API Views (Thin Layer)                          |
|  - Serializers (Validation & Data Mapping)                  |
|  - Service Layer (Heavy Business Logic)                     |
|    - Users Module (Auth, verification, profiles)            |
|    - Events Module (Categories, drafts, review)             |
|    - Bookings Module (Transaction locks, mailers)           |
+──────────────────────────────┬──────────────────────────────+
                               │ SQL Queries
+──────────────────────────────▼──────────────────────────────+
|                     POSTGRESQL DATABASE                     |
|  - Users, OrganizerProfiles, Events, Tiers, Bookings, Items |
+─────────────────────────────────────────────────────────────+
```

---

## Slide 5: Component Structure (Frontend & Backend)
### **Loose Coupling, Clean Separation**
* **Frontend**:
  * Unified public landing and detail pages with role-based redirects.
  * Role-guarded workspaces: `OrganizerDashboard` (locked/editable scopes), `AdminDashboard` (review tabs), and `UserDashboard` (booking log).
* **Backend Apps**:
  * `apps.users`: Handles registration, OTP, profile verification.
  * `apps.events`: Manages categories, event details, and admin approvals.
  * `apps.bookings`: Implements reservation transaction logic and confirmation email deliveries.
  * `apps.dashboard`: Direct analytics engine supplying stats counters.

---

## Slide 6: Core Workflows — Deadlock-Free Seat Reservation
### **Concurrency Control & Row Locking**
```
Attendee               Frontend                 DRF View            Service/Database
   │                      │                        │                       │
   │─── Confirm Book ────>│                        │                       │
   │                      │──── POST /bookings/ ──>│                       │
   │                      │                        │─── create_booking() ──│
   │                      │                        │                       │ [START TRANS]
   │                      │                        │                       │─── LOCK TIERS (ID Asc) ──>
   │                      │                        │                       │<── Return availability ───
   │                      │                        │                       │
   │                      │                        │                       │─── Verify capacity ───────>
   │                      │                        │                       │─── Decrement inventory ───>
   │                      │                        │                       │─── Save Booking & Items ──>
   │                      │                        │                       │─── Register on_commit() ──>
   │                      │                        │                       │
   │                      │                        │                       │ [COMMIT TRANS]
   │                      │                        │<─── Return Booking ───│
   │                      │<─── HTTP 201 Created ──│                       │
   │<── Redirect Conf ────│                        │                       │─── trigger commit task ──>
   │<── Email Received ────────────────────────────────────────────────────│ (Send SMTP Confirmation)
```

---

## Slide 7: Core Workflows — Event Submission & Review
### **State Transitions of an Event**
1. **DRAFT**: Organizer initializes event. Fully editable.
2. **SUBMITTED**: Organizer submits event for review. Action locked for organizer; appears in Admin Review Queue.
3. **REJECTED**: Admin rejects event with a reason. Organizer gets email notification; event returns to organizer workspace as editable draft.
4. **APPROVED**: Admin approves event. Organizer gets approval email. Event is pushed to the homepage public list.
5. **PUBLISHED**: Optional state. Admin publishes approved event. Visible publicly.

---

## Slide 8: Technical Challenges & Solutions
### **Key Mid-Term Enhancements**
* **MIME-Type Upload Failures**: 
  * *Challenge*: Browsers/clients upload banner images with missing or generic `application/octet-stream` MIME types, causing server rejections.
  * *Solution*: Upgraded validation logic in `EventImageValidator` to fall back to file extension checks, and expanded support to `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`, and `.tiff` up to 10MB.
* **Axios Global Content-Type Override**:
  * *Challenge*: Global Axios config locked requests to `application/json`, stripping multipart boundaries on `FormData` files.
  * *Solution*: Removed global overrides, letting Axios dynamically manage request MIME types and boundaries.
* **Booking of Approved Events**:
  * *Challenge*: Homepage listed `APPROVED` events, but ticket booking failed due to a legacy check restricting reservations to `PUBLISHED` events.
  * *Solution*: Unified validators to accept both `APPROVED` and `PUBLISHED` states.

---

## Slide 9: Project Status & Achievements
### **Accomplished So Far**
* **Functional Integration**: JWT token creation, storage in Zustand, and client-side page transitions are fully connected.
* **Event Creation, Updating, & Deletion**: Organizers can edit events, update ticket categories dynamically, and delete draft/rejected events.
* **Double-Booking Protection**: Implemented strict PostgreSQL `select_for_update` row locks on database transactions.
* **Transaction-Guaranteed Notifications**: Custom email confirmations trigger using Django's transactional `on_commit` hook, preventing state inconsistency.
* **Zero Compilation Issues**: TypeScript build completes cleanly; Django backend passes all system validation checks.

---

## Slide 10: Next Steps (Roadmap to Finals)
### **Core Goals for the Next Stage**
* **Payment Gateway Integration**: Hooking eSewa or Khalti APIs to handle mock financial transactions.
* **Dynamic Ticket Generation**: Creating PDF invoices/tickets with unique secure hash signatures.
* **Attendee Ticket Scanner**: Building mobile-friendly QR scanners to authorize event entry for check-ins.
* **Analytics Enhancements**: Advanced charts showing revenue projections on the Organizer Dashboard.
