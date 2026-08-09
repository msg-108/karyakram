# Karyakram Backend

Django REST Framework API for the Karyakram event management and ticket booking platform.

## Quick Start

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS/WSL
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Edit with your DB and mail settings

# Migrate and run
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API available at `http://localhost:8000/api/`  
Swagger UI at `http://localhost:8000/api/docs/`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Django secret key |
| `DEBUG` | ✅ | `True` for development |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `FRONTEND_URL` | ✅ | Frontend origin (for CORS & email links) |
| `ESEWA_MERCHANT_CODE` | ✅ | eSewa merchant code (`EPAYTEST` for sandbox) |
| `ESEWA_SECRET_KEY` | ✅ | eSewa HMAC secret (`8gBm/:&EnhH.1/q` for sandbox) |
| `EMAIL_HOST` | ❌ | SMTP host (defaults to console backend in dev) |
| `CELERY_TASK_ALWAYS_EAGER` | ❌ | `True` to run tasks synchronously without a Celery worker |

## Running Tests

```bash
python manage.py test apps.users.tests apps.events.tests apps.bookings.tests apps.payments.tests apps.tickets.tests
# Expected: Ran 31 tests in ~20s — OK
```

## Project Structure

```
backend/
├── apps/
│   ├── users/          # Auth, OTP, JWT, profiles, organizer approval
│   ├── events/         # Event CRUD, ticket tiers, categories, images
│   ├── bookings/       # Reservations, 10-min hold, cancellations
│   ├── payments/       # eSewa epay v2, HMAC signature, reconciliation
│   ├── tickets/        # QR JWT generation, check-in scanner validation
│   ├── dashboard/      # Analytics aggregation queries
│   └── common/         # Email engine, shared permissions
├── config/
│   └── settings/       # base.py, development.py, production.py
├── manage.py
└── requirements.txt
```

See [`../documentation/backend/architecture.md`](../documentation/backend/architecture.md) for deep-dive architecture docs.  
See [`../documentation/backend/api_docs.md`](../documentation/backend/api_docs.md) for full API reference.
