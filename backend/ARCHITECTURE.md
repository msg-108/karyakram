# Karyakram Architecture

## High-Level Principles

### Thin Views, Service-Oriented Logic
Django views (and DRF ViewSets) contain almost no business logic. Their responsibilities are strictly limited to:
1. Decoding input and parsing requests.
2. Validating serializers.
3. Invoking the appropriate function in the `services.py` layer.
4. Serializing the output for the response.

All complex operations, multi-model state changes, email triggering, and locking happen in `services.py`.

### Exceptions for Flow Control
We rely on Django REST Framework's standard exceptions (`ValidationError`, `PermissionDenied`, `NotFound`) in the service layer. Views simply let these exceptions bubble up to DRF's default exception handler, eliminating repetitive `try-except` blocks and manual HTTP response crafting.

### Atomicity and Concurrency
Booking tickets is a highly concurrent operation. The `create_booking` service relies on:
- `@transaction.atomic` for all state changes.
- `select_for_update()` to place explicit row-level locks on `TicketTier` objects to safely deduct `remaining_quantity`.
- Sorting by primary key before acquiring locks to prevent deadlocks.

## App Boundaries

1. **Users App (`apps.users`)**:
   Manages `User` (AbstractUser extension) and `OrganizerProfile`. The profile state machine (PENDING, APPROVED, REJECTED) enforces whether an organizer can create events.

2. **Events App (`apps.events`)**:
   Manages `EventCategory`, `Event`, and `TicketTier`.
   Events progress through `DRAFT -> REVIEW -> PUBLISHED -> CANCELLED/COMPLETED`. Event boundaries are strict; you cannot sell tickets to an unpublished event.

3. **Bookings App (`apps.bookings`)**:
   Manages `Booking` and `BookingItem`.
   The source of truth for "who holds what tickets." Initial creation reduces `remaining_quantity` and holds the booking in `PENDING` state for a set duration (e.g., 10 minutes). A background Celery worker (or management command) sweeps expired pending bookings and restores ticket quantities.

4. **Payments App (`apps.payments`)**:
   Responsible strictly for payment lifecycle tracking. It depends on `bookings`, but `bookings` knows as little about `payments` as possible. Once a payment reaches `COMPLETED`, the payment service calls `confirm_booking` to trigger the actual booking fulfillment.

5. **Tickets App (`apps.tickets`)**:
   QR generation and check-in logic. Generated automatically when a booking is confirmed. The QR string is a self-contained JWT that encodes `ticket_id` and `event_id`, signed symmetrically with the backend secret. Verification requires database access to prevent multi-use (stateful check-in), but the payload itself is cryptographically secure.

## Data Models (ER Overview)
```
[User] 1 ---- 1 [OrganizerProfile]
  |                   |
  |                   *
  |                [Event] 1 ---- * [TicketTier]
  |                   |                   |
  *                   |                   |
[Booking] * ----------+                   |
  |                   |                   |
  *                   *                   |
[Payment]         [Ticket]                |
  |                   |                   |
  +--- [BookingItem]--+-------------------+
```

## Testing Strategy
Integration tests are favored over mocked unit tests for core services (like bookings). 
- **Tools:** `pytest`, `factory_boy`, `pytest-django`.
- **Database:** Standard SQLite memory DB or PostgreSQL. Test classes inherit from `TransactionTestCase` when they need to test row locks or advanced commit hooks properly.
