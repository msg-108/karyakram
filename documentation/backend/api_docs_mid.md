Karyakram Backend API Documentation
1. Project Overview
Karyakram is a Django REST Framework backend for event management and ticket booking. It supports:

Public event discovery and category browsing
Organizer event creation, review, and submission workflows
Admin moderation of organizers and events
User booking flows with ticket inventory reservation
Dashboard summaries for users and organizers
Tech stack
Python 3.10+ / 3.11 recommended
Django 6.0.6
Django REST Framework
PostgreSQL
SimpleJWT for access/refresh tokens
drf-spectacular for OpenAPI schema and Swagger UI
django-filter and corsheaders
Pillow for image uploads
Base URL
Development: http://127.0.0.1:8000
API prefix: /api/
Interactive docs
OpenAPI schema: http://127.0.0.1:8000/api/schema/
Swagger UI: http://127.0.0.1:8000/api/docs/
Redoc: http://127.0.0.1:8000/api/redoc/
2. Setup & Installation
2.1 Python version and dependencies
Use a modern Python version compatible with Django 6.0.x.

python --version
# Python 3.11.x or 3.12.x recommended
Create and activate a virtual environment:

cd d:\karyakram
python -m venv .venv
.venv\Scripts\activate
On Linux/macOS:

python -m venv .venv
source .venv/bin/activate
Install the Python packages required by the project:

pip install -U pip setuptools wheel
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers django-filter drf-spectacular drf-spectacular-sidecar python-decouple psycopg2-binary pillow
If you want to mirror the repo layout more closely, install from the requirements directory:

pip install -r backend/requirements/base.txt
Note: the repo currently contains empty development/production requirement files, so the package list above is the practical minimum for local development.

2.2 Database configuration
Karyakram expects PostgreSQL. Create a local database and user:

CREATE DATABASE karyakram_db;
CREATE USER karyakram_user WITH PASSWORD 'karyakram';
ALTER ROLE karyakram_user SET client_encoding TO 'utf8';
ALTER ROLE karyakram_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE karyakram_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE karyakram_db TO karyakram_user;
2.3 Environment variables (.env)
Create a file named .env in the backend directory (or project root if your deployment workflow expects it) with values similar to:

SECRET_KEY=change-me-to-a-long-random-string
ALLOWED_HOSTS=localhost,127.0.0.1
FIELD_ENCRYPTION_KEY=replace-with-a-32-byte-or-longer-secret
DB_NAME=karyakram_db
DB_USER=karyakram_user
DB_PASSWORD=karyakram
DB_HOST=localhost
DB_PORT=5432
DEBUG=True
The current settings file uses hard-coded local PostgreSQL defaults in the base settings, so you may need to update those values to read from environment variables in production.

2.4 Running locally
Run migrations:

cd backend
python manage.py migrate
Create a superuser:

python manage.py createsuperuser
Start the development server:

python manage.py runserver 0.0.0.0:8000
Check the API docs:

curl http://127.0.0.1:8000/api/schema/
3. Architecture
3.1 Folder structure
backend/
  apps/
    users/        # authentication, users, organizer profiles, OTPs
    events/       # categories, events, event images, ticket tiers
    bookings/     # bookings, booking items, booking payments
    dashboard/    # dashboard summaries and analytics views
  config/
    settings/     # base/development/production settings
    urls.py       # top-level api route wiring
  requirements/   # dependency hints
  manage.py
3.2 Core models and relationships
User: custom user model with roles USER and ORGANIZER.
OrganizerProfile: one-to-one with User for organizer-specific business data.
EmailOTP: one OTP per user/purpose, used for email verification.
EventCategory: reusable taxonomy for events.
Event: owned by an OrganizerProfile, linked to category and review workflow.
EventImage: gallery images belonging to an Event.
TicketTier: ticket types for an event with price/quantity/remaining_quantity.
Booking: a purchase transaction made by a user for one event.
BookingItem: line items linking a booking to one ticket tier.
BookingPayment: placeholder payment model reserved for future payments work.
3.3 Key design patterns
Thin views: views parse request data and delegate business logic to services.
Service layer: all non-trivial operations live in services.py and use transaction.atomic for database consistency.
Serializer layer: serializers validate request shapes and serialize responses.
Permission classes: custom DRF permissions encode organizer/user/admin access rules.
JWT-based auth: access and refresh tokens issued by SimpleJWT.
4. Database Schema
4.1 Users and auth models
User
Fields:

id (PK)
username (unique, validated)
email (unique)
first_name
last_name
role: USER | ORGANIZER
is_active
is_email_verified
is_approved
created_at
updated_at
Relationships:

One-to-one with OrganizerProfile via organizer_profile
One-to-many with EmailOTP via otps
One-to-many with Booking via bookings
OrganizerProfile
Fields:

id (PK)
user (OneToOne to User)
organization_name
organization_description
website_url
citizenship_number
pan_number
bank_account_number
bank_name
citizenship_document
pan_document
approval_requested_at
approved_at
approved_by (FK to User, nullable)
rejection_reason
created_at
updated_at
EmailOTP
Fields:

id (PK)
user (FK to User)
purpose: EMAIL_VERIFICATION | PASSWORD_RESET
code
attempts
created_at
last_sent_at
4.2 Event models
EventCategory
Fields:

id (PK)
name (unique)
slug (unique)
description
icon
is_active
created_at
updated_at
Event
Fields:

id (PK)
organizer (FK to OrganizerProfile)
category (FK to EventCategory)
title
slug (unique)
short_description
description
terms_and_conditions
venue
address
city
district
province
latitude
longitude
banner
start_datetime
end_datetime
registration_deadline
capacity
visibility: PUBLIC | UNLISTED
status: DRAFT | SUBMITTED | APPROVED | REJECTED | PUBLISHED | ARCHIVED
approved_by (FK to User, nullable)
approved_at
rejection_reason
published_at
created_at
updated_at
EventImage
Fields:

id (PK)
event (FK to Event)
image
caption
display_order
created_at
updated_at
TicketTier
Fields:

id (PK)
event (FK to Event)
name
description
price
quantity
remaining_quantity
display_order
is_active
created_at
updated_at
4.3 Booking models
Booking
Fields:

id (PK)
user (FK to User)
event (FK to Event)
status: PENDING | CONFIRMED | CANCELLED
total_amount
cancelled_at
created_at
updated_at
BookingItem
Fields:

id (PK)
booking (FK to Booking)
ticket_tier (FK to TicketTier)
quantity
price_at_purchase
created_at
BookingPayment
Fields:

id (PK)
booking (OneToOne to Booking)
provider
status: PENDING | SUCCEEDED | FAILED | REFUNDED
amount
created_at
updated_at
4.4 Relationships summary
User 1:N OrganizerProfile? Actually one-to-one; a User may have one organizer profile.
OrganizerProfile 1:N Event
Event 1:N TicketTier
Event 1:N EventImage
Booking 1:N BookingItem
BookingItem belongs to one TicketTier
BookingPayment belongs to one Booking
4.5 Key indexes
Indexed in the models:

users.User: role, is_active + is_email_verified
events.Event: status, visibility+status, organizer+status, start_datetime, city
events.EventImage: event + display_order
events.TicketTier: event + is_active
bookings.Booking: user+status, event+status, status
bookings.BookingItem: booking, ticket_tier
There are no ManyToMany relationships in the current schema.

5. API Endpoints
All endpoints below are prefixed by /api unless otherwise noted.

5.1 Authentication and profile
Method	Path	Auth	Summary	Status codes
POST	/api/auth/register/user/	No	Register a regular user	201, 400, 500
POST	/api/auth/register/organizer/	No	Register an organizer and upload documents	201, 400, 500
POST	/api/auth/verify-otp/	No	Verify a 6-digit OTP	200, 400, 500
POST	/api/auth/resend-otp/	No	Resend OTP email	200, 400, 500
POST	/api/auth/login/	No	Obtain access/refresh JWTs	200, 400, 403, 500
POST	/api/auth/token/refresh/	No	Refresh access token	200, 400, 500
GET	/api/me/	Yes, JWT	Fetch own profile	200, 401, 500
GET	/api/me/organizer-profile/	Yes, JWT + organizer	Fetch organizer profile	200, 401, 403, 404, 500
GET	/api/admin/organizers/pending/	Yes, admin	List pending organizers	200, 401, 403, 500
POST	/api/admin/organizers/<user_id>/approval/	Yes, admin	Approve or reject organizer	200, 400, 401, 403, 404, 500
Example: register a user
curl -X POST http://127.0.0.1:8000/api/auth/register/user/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sitagharti",
    "email": "sita@example.com",
    "password": "S3cure!Pass",
    "password_confirm": "S3cure!Pass",
    "first_name": "Sita",
    "last_name": "Gharti"
  }'
Success response (201):

{
  "id": 1,
  "username": "sitagharti",
  "email": "sita@example.com",
  "first_name": "Sita",
  "last_name": "Gharti",
  "role": "USER",
  "is_email_verified": false,
  "is_approved": false,
  "created_at": "2026-07-17T03:30:00Z"
}
Example: login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sitagharti",
    "password": "S3cure!Pass"
  }'
Success response (200):

{
  "refresh": "<refresh-token>",
  "access": "<access-token>"
}
Error response (403):

{
  "detail": "Your organizer account is pending admin approval."
}
5.2 Public events and categories
Method	Path	Auth	Summary	Status codes
GET	/api/events/	No	List published public events	200, 400, 500
GET	/api/events/trending/	No	Top trending published events	200, 500
GET	/api/events/recommendations/	Optional	Personalized recommendations (with cold-start fallbacks)	200, 500
GET	/api/events/<slug>/	No	Get one published public event	200, 404, 500
GET	/api/categories/	No	List active categories	200, 500

Query parameters for GET /api/events/
q: string (free-text search)
category: string (category slug)
city: string (exact city match)
start_date_from: ISO-8601 datetime
start_date_to: ISO-8601 datetime
ordering: string ('trending' or 'upcoming')
limit: integer (max items for trending/recommendations endpoints, default 10)

Algorithm Guarantees & Edge-Case Fallbacks:
- Trending Algorithm: Ranks events by 7-day sales velocity, total confirmed tickets sold, and upcoming start datetime. If zero tickets have been sold across the platform, ordering falls back gracefully to start_datetime (soonest upcoming events first).
- Recommendation Algorithm: For logged-in users, matches top booked categories (excluding already booked events). For anonymous/new users (cold-start), automatically backfills with top trending/upcoming events so new users always see a full, curated list.
- Empty Platform State: If zero or very few events are published, endpoints safely return all available published events or an empty array (count: 0) without erroring.

Example:
curl "http://127.0.0.1:8000/api/events/?q=music&city=Kathmandu&category=concerts&ordering=trending"
Success response (200):

[
  {
    "id": 3,
    "slug": "summer-festival-2026",
    "title": "Summer Festival 2026",
    "short_description": "A weekend of music and food.",
    "category": {
      "id": 1,
      "name": "Music",
      "slug": "music",
      "description": "",
      "icon": "",
      "is_active": true
    },
    "organizer_name": "Nepal Events Hub",
    "venue": "Bhrikuti Mandap",
    "city": "Kathmandu",
    "banner": null,
    "start_datetime": "2026-08-10T18:00:00Z",
    "end_datetime": "2026-08-11T22:00:00Z"
  }
]
5.3 Organizer event management
Method	Path	Auth	Summary	Status codes
GET	/api/organizer/events/	Yes, JWT + organizer	List organizer events	200, 401, 403, 500
POST	/api/organizer/events/	Yes, JWT + organizer	Create a draft event	201, 400, 401, 403, 500
GET	/api/organizer/events//	Yes, JWT + organizer	Get one organizer event	200, 401, 403, 404, 500
PATCH	/api/organizer/events//	Yes, JWT + organizer	Update draft/rejected event	200, 400, 401, 403, 404, 500
DELETE	/api/organizer/events//	Yes, JWT + organizer	Delete draft/rejected event	204, 400, 401, 403, 404, 500
POST	/api/organizer/events//submit/	Yes, JWT + approved organizer	Submit event for review	200, 400, 401, 403, 404, 500
Example: create a draft event
curl -X POST http://127.0.0.1:8000/api/events/organizer/events/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Thinking Workshop",
    "short_description": "A one-day workshop.",
    "description": "Hands-on design sprint.",
    "terms_and_conditions": "No refunds after registration closes.",
    "category": 1,
    "venue": "Innovation Lab",
    "address": "New Road",
    "city": "Kathmandu",
    "district": "Kathmandu",
    "province": "Bagmati",
    "start_datetime": "2026-08-20T09:00:00Z",
    "end_datetime": "2026-08-20T17:00:00Z",
    "registration_deadline": "2026-08-19T23:59:59Z",
    "capacity": 100,
    "visibility": "PUBLIC",
    "ticket_tiers": [
      {"name": "General", "description": "Standard entry", "price": 1000, "quantity": 80, "display_order": 1, "is_active": true},
      {"name": "VIP", "description": "Priority seating", "price": 2500, "quantity": 20, "display_order": 2, "is_active": true}
    ]
  }'
Success response (201):

{
  "id": 10,
  "slug": "design-thinking-workshop",
  "title": "Design Thinking Workshop",
  "status": "DRAFT",
  "visibility": "PUBLIC",
  "category": {
    "id": 1,
    "name": "Workshop",
    "slug": "workshop",
    "description": "",
    "icon": "",
    "is_active": true
  },
  "gallery_images": [],
  "ticket_tiers": [
    {
      "id": 11,
      "name": "General",
      "price": "1000.00",
      "quantity": 80,
      "remaining_quantity": 80,
      "display_order": 1,
      "is_active": true
    }
  ]
}
5.4 Organizer ticket tiers and gallery images
Method	Path	Auth	Summary	Status codes
GET	/api/organizer/events//tiers/	Yes, JWT + organizer	List ticket tiers for an event	200, 401, 403, 404, 500
POST	/api/organizer/events//tiers/	Yes, JWT + organizer	Create a ticket tier	201, 400, 401, 403, 404, 500
PATCH	/api/organizer/ticket-tiers//	Yes, JWT + organizer	Update a ticket tier	200, 400, 401, 403, 404, 500
DELETE	/api/organizer/ticket-tiers//	Yes, JWT + organizer	Delete a ticket tier	204, 400, 401, 403, 404, 500
GET	/api/organizer/events//images/	Yes, JWT + organizer	List gallery images	200, 401, 403, 404, 500
POST	/api/organizer/events//images/	Yes, JWT + organizer	Upload a gallery image	201, 400, 401, 403, 404, 500
5.5 Admin review endpoints
Method	Path	Auth	Summary	Status codes
GET	/api/admin/events/pending/	Yes, admin	List submitted events awaiting review	200, 401, 403, 500
POST	/api/admin/events//approve/	Yes, admin	Approve or reject event	200, 400, 401, 403, 404, 500
POST	/api/admin/events//publish/	Yes, admin	Publish an approved event	200, 400, 401, 403, 404, 500
5.6 Booking endpoints
Method	Path	Auth	Summary	Status codes
GET	/api/bookings/bookings/	Yes, JWT + regular user	List user bookings	200, 401, 403, 500
POST	/api/bookings/bookings/	Yes, JWT + regular user	Create a booking	201, 400, 401, 403, 500
GET	/api/bookings/bookings//	Yes, JWT + regular user	Get booking details	200, 401, 403, 404, 500
POST	/api/bookings/bookings//cancel/	Yes, JWT + regular user	Cancel a confirmed booking	200, 400, 401, 403, 404, 500
Example: create a booking
curl -X POST http://127.0.0.1:8000/api/bookings/bookings/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event": 10,
    "items": [
      {"ticket_tier": 11, "quantity": 2}
    ]
  }'
Success response (201):

{
  "id": 5,
  "event": 10,
  "event_title": "Design Thinking Workshop",
  "event_start_datetime": "2026-08-20T09:00:00Z",
  "event_venue": "Innovation Lab",
  "status": "CONFIRMED",
  "total_amount": "2000.00",
  "items": [
    {
      "id": 12,
      "ticket_tier": 11,
      "ticket_tier_name": "General",
      "quantity": 2,
      "price_at_purchase": "1000.00",
      "subtotal": "2000.00"
    }
  ],
  "cancelled_at": null,
  "created_at": "2026-07-17T03:45:00Z",
  "updated_at": "2026-07-17T03:45:00Z"
}
Error response (400):

{
  "items": "Only 1 of 'General' remaining, but 2 were requested."
}
5.7 Dashboard endpoints
Method	Path	Auth	Summary	Status codes
GET	/api/dashboard/user/summary/	Yes, JWT + user	User dashboard summary	200, 401, 403, 500
GET	/api/dashboard/user/tickets/upcoming/	Yes, JWT + user	Upcoming tickets	200, 401, 403, 500
GET	/api/dashboard/user/tickets/history/	Yes, JWT + user	Ticket history	200, 401, 403, 500
GET	/api/dashboard/user/payments/	Yes, JWT + user	Payment history	200, 401, 403, 500
GET	/api/dashboard/user/events/upcoming/	Yes, JWT + user	Upcoming events	200, 401, 403, 500
GET	/api/dashboard/user/activity/	Yes, JWT + user	Recent activity	200, 401, 403, 500
GET	/api/dashboard/notifications/	Yes, JWT	Notifications	200, 401, 500
GET	/api/dashboard/organizer/summary/	Yes, JWT + organizer	Organizer summary	200, 401, 403, 500
GET	/api/dashboard/organizer/events/	Yes, JWT + organizer	Organizer event list	200, 401, 403, 500
GET	/api/dashboard/organizer/events/upcoming/	Yes, JWT + organizer	Organizer upcoming events	200, 401, 403, 500
GET	/api/dashboard/organizer/events/<event_id>/attendees/	Yes, JWT + organizer	Event attendees	200, 401, 403, 404, 500
GET	/api/dashboard/organizer/statistics/events/	Yes, JWT + organizer	Event statistics	200, 401, 403, 500
GET	/api/dashboard/organizer/statistics/revenue/	Yes, JWT + organizer	Revenue analytics	200, 401, 403, 500
GET	/api/dashboard/organizer/statistics/tickets/	Yes, JWT + organizer	Ticket sales summary	200, 401, 403, 500
GET	/api/dashboard/organizer/statistics/checkins/	Yes, JWT + organizer	Check-in stats	200, 401, 403, 500
GET	/api/dashboard/organizer/statistics/qr-scans/	Yes, JWT + organizer	QR scan stats	200, 401, 403, 500
GET	/api/dashboard/organizer/orders/recent/	Yes, JWT + organizer	Recent orders	200, 401, 403, 500
GET	/api/dashboard/organizer/reports/<report_type>/export/	Yes, JWT + organizer	Report export (future-ready)	200, 401, 403, 404, 501, 500
6. Authentication & Permissions
6.1 User roles and access levels
Regular user: can register, verify email, log in, create bookings, view own bookings, access user dashboard endpoints.
Organizer: can register, verify email, log in, create/manage events, upload images, create ticket tiers, view organizer dashboards.
Admin: can approve or reject organizers, review events, publish approved events, and access admin-only dashboard/reporting endpoints.
6.2 Token authentication flow
Register a user or organizer.
Verify the OTP email.
Call /api/auth/login/ with username/password.
Save the access and refresh tokens.
Send the access token in the Authorization header:
curl -H "Authorization: Bearer <access-token>" http://127.0.0.1:8000/api/me/
Refresh an expired access token with /api/auth/token/refresh/.
curl -X POST http://127.0.0.1:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh-token>"}'
6.3 Permission classes per endpoint
AllowAny: public event browsing, categories, registration, OTP, login, token refresh.
IsAuthenticated: profile endpoints, dashboard endpoints.
IsPlainUser: booking endpoints and most user dashboard endpoints.
IsOrganizer: organizer event management and organizer dashboard endpoints.
IsApprovedOrganizer: organizer submission to review workflow.
IsAdminUser / CanApproveEvent: admin actions for organizer and event review.
7. Error Handling
7.1 Error response format
The backend uses DRF-style validation errors and standard HTTP status codes.

Validation error example (400):

{
  "password_confirm": [
    "Passwords don't match."
  ]
}
Detail error example (403):

{
  "detail": "Your organizer account is pending admin approval."
}
7.2 Common error codes
400 Bad Request: invalid payload, invalid date range, invalid ticket quantity, event not editable, insufficient inventory.
401 Unauthorized: missing or invalid JWT.
403 Forbidden: insufficient permission or organizer account unapproved.
404 Not Found: unknown resource, wrong booking ID, unknown event slug.
500 Internal Server Error: unhandled exception or DB failure.
7.3 Logging and handling
The service layer logs failures with logger.exception for email delivery and other operational errors. In production, capture logs to stdout or a managed system like Papertrail, Datadog, or ELK.

Example:

logger.exception("Failed to send email", extra={"user_id": user.pk, "email": user.email})
Recommended error handling in client apps:

Surface 400 validation details to the user.
Prompt the user to reauthenticate on 401.
Show a friendly permission message on 403.
Retry transient 500s only when safe.
8. Testing
8.1 How to run tests
Run the Django test suite:

cd backend
python manage.py test
You can scope tests by app:

python manage.py test apps.users apps.events apps.bookings apps.dashboard
8.2 Example test cases
Example: test login rejection for unverified users.

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="S3cure!Pass",
            is_active=False,
            is_email_verified=False,
        )

    def test_login_fails_for_unverified_user(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "alice", "password": "S3cure!Pass"},
            format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("verify your email", response.json().get("detail", ""))
Example: test booking creation with insufficient inventory.

from rest_framework.test import APITestCase
from apps.users.models import User

class BookingTests(APITestCase):
    def test_booking_rejects_when_inventory_is_insufficient(self):
        user = User.objects.create_user(username="bob", email="bob@example.com", password="S3cure!Pass")
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/bookings/bookings/",
            {"event": 1, "items": [{"ticket_tier": 1, "quantity": 999}]},
            format="json"
        )

        self.assertEqual(response.status_code, 400)
9. Deployment
9.1 Production environment setup
Recommended production settings:

Set DEBUG=False.
Set ALLOWED_HOSTS to your actual domain(s).
Use environment variables for secrets and database credentials.
Run behind gunicorn or uvicorn (if ASGI is used).
Serve static and media files through a CDN or object storage service.
Example production environment variables:

DEBUG=False
SECRET_KEY=very-long-random-secret
ALLOWED_HOSTS=api.karyakram.example.com
DB_NAME=karyakram_prod
DB_USER=karyakram_user
DB_PASSWORD=strong-password
DB_HOST=db.internal
DB_PORT=5432
FIELD_ENCRYPTION_KEY=replace-me-with-a-strong-key
9.2 Database migrations
python manage.py migrate
python manage.py collectstatic --noinput
9.3 Static files and media handling
Static files are served from the STATIC_URL setting.
Event banners and organizer documents are uploaded as media files.
In production, store media in a dedicated storage backend (for example S3 or Azure Blob Storage) rather than the local filesystem.
Example with local media in development:

curl -F "image=@/path/to/banner.jpg" http://127.0.0.1:8000/api/organizer/events/1/images/
10. Troubleshooting
Problem: ValueError: FIELD_ENCRYPTION_KEY is not set in environment
Solution:

Add FIELD_ENCRYPTION_KEY to your environment before running Django.
Restart the server after changing the environment.
Problem: database connection refused
Solution:

Ensure PostgreSQL is running.
Confirm the DB host, port, user, and password in settings or environment variables.
Verify the database exists and the user has privileges.
Problem: 401 Unauthorized on every request
Solution:

Confirm the access token is included in the Authorization header.
Check if the token is expired; refresh it if necessary.
Ensure the token type is Bearer.
Problem: 403 Forbidden on organizer endpoints
Solution:

Confirm the user has a linked OrganizerProfile.
Confirm the organizer account was approved by an admin.
For submission endpoints, a pending organizer account cannot submit events.
Problem: event creation fails with validation errors
Solution:

Ensure the event has at least one ticket tier.
Check that end_datetime is after start_datetime.
Check that registration_deadline is not after start_datetime.
Problem: static/media uploads do not appear
Solution:

Verify the MEDIA_ROOT/MEDIA_URL settings in your environment.
Ensure the application has permission to write to the configured directory.
In production, use a remote storage backend.
Useful Commands Summary
# Start dev server
cd backend
python manage.py runserver 0.0.0.0:8000

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Generate schema
python manage.py spectacular --file schema.yml

# Run tests
python manage.py test
This document is intended to be a practical developer reference for the current Karyakram backend implementation and its DRF endpoints.