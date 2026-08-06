# Karyakram - Backend API

Karyakram is an event ticketing and management platform backend built with Django and Django REST Framework. It provides a robust, concurrent-safe API for event creation, booking flow, payment integration, and QR code-based ticketing.

## Features
- **Authentication**: Custom user model with JWT token authentication.
- **Organizer Profiles**: Users can apply to be organizers. Applications require admin approval.
- **Event Management**: Create, update, and manage events, including ticket tiers (e.g., VIP, General Admission), categorization, and limits.
- **Booking Flow with Locking**: A reliable booking system that guarantees inventory via row-level database locking.
- **Payment Integrations**: Handles PENDING, COMPLETED, and FAILED states for transactions (eSewa and Khalti simulated).
- **QR Tickets**: JWT-based QR code generation for offline-verifiable ticketing. Tickets can only be checked in once.

## Getting Started

### Prerequisites
- Python 3.12+
- PostgreSQL (or SQLite for development)
- Redis Server (required for async tasks and background jobs)
- WSL (if developing on Windows)

### Installation
1. Clone the repository and navigate into the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements/base.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Ensure Redis is running:
   ```bash
   sudo service redis-server start
   ```
6. Start the development server (Terminal 1):
   ```bash
   python manage.py runserver
   ```
7. Start the Celery worker & beat (Terminal 2):
   ```bash
   celery -A config worker --beat -l INFO
   ```

### Running Tests
The backend uses `pytest`, `factory_boy`, and standard Django tests.
```bash
python manage.py test apps
```

## Structure
- `apps/users`: User management and organizer profiles.
- `apps/events`: Events, categories, and ticket tiers.
- `apps/bookings`: Booking logic, hold expiration, and inventory management.
- `apps/payments`: Payment initiation and verification webhooks.
- `apps/tickets`: QR code generation and validation.

For more deep-dive technical details, read `../documentation/backend/architecture.md`.
