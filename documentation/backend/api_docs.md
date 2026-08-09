# Karyakram — Complete API Documentation

*Version 2.0 — Final Release — August 2026*

**Base URL (Development):** `http://localhost:8000/api/`  
**Swagger UI:** `http://localhost:8000/api/docs/`  
**OpenAPI Schema:** `http://localhost:8000/api/schema/`  
**Redoc:** `http://localhost:8000/api/redoc/`

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

Tokens are obtained via the login endpoint and refreshed using the refresh endpoint.

---

## 1. User Authentication Endpoints

### Register a New User
```
POST /api/users/register/
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "ATTENDEE"
}
```
> `role` accepts: `"ATTENDEE"` or `"ORGANIZER"`

**Response `201 Created`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "ATTENDEE",
  "is_email_verified": false
}
```
> OTP verification code is emailed immediately.

---

### Verify Email OTP
```
POST /api/users/verify-email/
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "481920"
}
```
**Response `200 OK`:**
```json
{ "detail": "Email verified successfully." }
```

---

### Login
```
POST /api/users/login/
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
**Response `200 OK`:**
```json
{
  "access": "<JWT_ACCESS_TOKEN>",
  "refresh": "<JWT_REFRESH_TOKEN>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "ATTENDEE",
    "first_name": "John",
    "is_email_verified": true,
    "is_staff": false
  }
}
```

---

### Refresh Access Token
```
POST /api/users/token/refresh/
```
**Request Body:**
```json
{ "refresh": "<JWT_REFRESH_TOKEN>" }
```
**Response `200 OK`:**
```json
{ "access": "<NEW_ACCESS_TOKEN>" }
```

---

### Get Current User Profile
```
GET /api/users/me/
Authorization: Bearer <token>
```
**Response `200 OK`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "role": "ATTENDEE",
  "is_email_verified": true
}
```

---

## 2. Event Endpoints

### List Published Events (Public)
```
GET /api/events/?page=1&category=music&search=concert
```
**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1, page_size: 12) |
| `search` | string | Full-text search on event title/description |
| `category` | string | Filter by category slug |
| `city` | string | Filter by city name |

**Response `200 OK`:**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/events/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "slug": "chris-cornell-tribute-2026",
      "title": "Chris Cornell Tribute",
      "description": "...",
      "venue": "Rastriya Naachghar",
      "city": "Kathmandu",
      "start_datetime": "2026-08-09T20:30:00+05:45",
      "end_datetime": "2026-08-09T23:00:00+05:45",
      "organizer_name": "Rock Nepal",
      "ticket_tiers": [
        { "id": 1, "name": "General Admission", "price": "500.00", "remaining_quantity": 150 },
        { "id": 2, "name": "VIP", "price": "1000.00", "remaining_quantity": 30 }
      ]
    }
  ]
}
```

---

### Get Event Detail (Public)
```
GET /api/events/{slug}/
```

---

### List Event Categories (Public)
```
GET /api/events/categories/
```

---

### Create Event (Organizer)
```
POST /api/organizer/events/
Authorization: Bearer <organizer_token>
Content-Type: multipart/form-data
```
**Request Fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Event title |
| `description` | string | ✅ | Event description |
| `venue` | string | ✅ | Venue name |
| `address` | string | ✅ | Full address |
| `city` | string | ✅ | City name |
| `start_datetime` | ISO datetime | ✅ | Event start date & time |
| `end_datetime` | ISO datetime | ✅ | Event end date & time |
| `booking_deadline` | ISO datetime | ❌ | Last time to book |
| `category` | int (ID) | ✅ | Category ID |

---

### Submit Event for Admin Review (Organizer)
```
POST /api/organizer/events/{id}/submit/
Authorization: Bearer <organizer_token>
```
**Response `200 OK`:**
```json
{ "detail": "Event submitted for review.", "status": "REVIEW" }
```

---

### Approve / Reject Event (Admin)
```
POST /api/admin/events/{id}/approve/
POST /api/admin/events/{id}/reject/
Authorization: Bearer <admin_token>
```

---

## 3. Booking Endpoints

### Create Booking (10-Minute Hold)
```
POST /api/bookings/
Authorization: Bearer <attendee_token>
```
**Request Body:**
```json
{
  "event": 1,
  "items": [
    { "ticket_tier": 1, "quantity": 2 },
    { "ticket_tier": 2, "quantity": 1 }
  ]
}
```
**Response `201 Created`:**
```json
{
  "id": 47,
  "event": 1,
  "event_title": "Chris Cornell Tribute",
  "status": "PENDING",
  "total_amount": "2000.00",
  "hold_expires_at": "2026-08-09T15:10:00Z",
  "items": [
    { "ticket_tier": 1, "ticket_tier_name": "General Admission", "quantity": 2, "price_at_purchase": "500.00", "subtotal": "1000.00" },
    { "ticket_tier": 2, "ticket_tier_name": "VIP", "quantity": 1, "price_at_purchase": "1000.00", "subtotal": "1000.00" }
  ],
  "created_at": "2026-08-09T15:00:00Z"
}
```

---

### List User's Bookings (Paginated)
```
GET /api/bookings/?page=1
Authorization: Bearer <attendee_token>
```
**Response `200 OK`:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [ ...booking objects... ]
}
```

---

### Cancel Booking
```
POST /api/bookings/{id}/cancel/
Authorization: Bearer <attendee_token>
```
> Restores `remaining_quantity` to all affected tiers.  
> Sets payment status to `REFUNDED` if payment was completed.

---

## 4. Payment Endpoints

### Initiate eSewa Payment
```
POST /api/bookings/{id}/payment/initiate/
Authorization: Bearer <attendee_token>
```
**Request Body:**
```json
{ "provider": "ESEWA" }
```
**Response `200 OK`:**
```json
{
  "provider": "ESEWA",
  "payment_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  "params": {
    "amount": "2000",
    "tax_amount": "0",
    "total_amount": "2000",
    "transaction_uuid": "booking-47-1723199999",
    "product_code": "EPAYTEST",
    "product_service_charge": "0",
    "product_delivery_charge": "0",
    "success_url": "http://localhost:5173/payment/callback",
    "failure_url": "http://localhost:5173/payment/callback",
    "signed_field_names": "total_amount,transaction_uuid,product_code",
    "signature": "<HMAC_SHA256_BASE64>"
  }
}
```

---

### Verify eSewa Payment
```
POST /api/bookings/{id}/payment/verify/
Authorization: Bearer <attendee_token>
```
**Request Body:**
```json
{
  "provider": "ESEWA",
  "pidx": "<base64_encoded_esewa_response_data>"
}
```
**On Success `200 OK`:**
```json
{
  "status": "CONFIRMED",
  "booking_id": 47,
  "detail": "Payment verified and booking confirmed."
}
```
> On success: booking status → `CONFIRMED`, tickets generated, QR email sent.

---

## 5. Ticket Endpoints

### List User's Tickets (Paginated)
```
GET /api/me/tickets/?page=1
Authorization: Bearer <attendee_token>
```
**Response `200 OK`:**
```json
{
  "count": 3,
  "results": [
    {
      "id": "ffe75bae-c380-4718-92cb-729eb7a65717",
      "booking_id": 47,
      "attendee_name": "John Doe",
      "attendee_email": "user@example.com",
      "status": "VALID",
      "status_display": "Valid",
      "qr_code_payload": "<signed_jwt_string>",
      "event_title": "Chris Cornell Tribute",
      "event_start_datetime": "2026-08-09T20:30:00+05:45",
      "event_venue": "Rastriya Naachghar",
      "event_city": "Kathmandu",
      "booking_item": { "ticket_tier_name": "VIP", "quantity": 1, ... },
      "booked_at": "2026-08-09T15:00:00Z",
      "created_at": "2026-08-09T15:05:22Z"
    }
  ]
}
```

---

### Organizer: Check-in a QR Ticket
```
POST /api/events/{event_id}/check-in/
Authorization: Bearer <organizer_token>
```
**Request Body:**
```json
{ "qr_payload": "<scanned_jwt_string>" }
```
**Response `200 OK`:**
```json
{
  "id": "ffe75bae-...",
  "attendee_name": "John Doe",
  "status": "CHECKED_IN",
  "checked_in_at": "2026-08-09T20:32:15Z",
  "event_title": "Chris Cornell Tribute"
}
```
**Error Responses:**
- `400` — `"Ticket has already been checked in."`
- `400` — `"Ticket is not valid for this event."`
- `401` — JWT expired or invalid
- `403` — Not the event organizer

---

## 6. Dashboard Endpoints

### User Dashboard Summary
```
GET /api/dashboard/user/summary/
Authorization: Bearer <attendee_token>
```
**Response:**
```json
{
  "upcoming_ticket_count": 2,
  "total_ticket_count": 5,
  "unread_notification_count": 0
}
```

### Organizer Dashboard Summary
```
GET /api/dashboard/organizer/summary/
Authorization: Bearer <organizer_token>
```
**Response:**
```json
{
  "total_events": 3,
  "published_events": 2,
  "total_revenue": "25000.00",
  "total_tickets_sold": 47,
  "total_attendees_checked_in": 38
}
```

---

## 7. Admin Endpoints

### List Pending Organizer Applications
```
GET /api/admin/organizers/pending/
Authorization: Bearer <admin_token>
```

### Approve / Reject Organizer
```
POST /api/admin/organizers/{id}/approve/
POST /api/admin/organizers/{id}/reject/
Authorization: Bearer <admin_token>
```

### List Pending Events
```
GET /api/admin/events/pending/
Authorization: Bearer <admin_token>
```

---

## 8. HTTP Status Code Reference

| Code | Meaning |
|------|---------|
| `200 OK` | Success |
| `201 Created` | Resource created |
| `400 Bad Request` | Validation error — check `detail` field |
| `401 Unauthorized` | Missing or expired JWT token |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected backend error |

---

## 9. Postman Testing Walkthrough

### Step 1 — Set up Postman Environment
Create a Postman environment with these variables:
| Variable | Value |
|---|---|
| `base_url` | `http://localhost:8000/api` |
| `access_token` | *(empty — filled after login)* |
| `booking_id` | *(empty — filled after booking)* |

### Step 2 — Register & Login
1. `POST {{base_url}}/users/register/` — Create test user
2. Check console output or email for OTP code
3. `POST {{base_url}}/users/verify-email/` — Submit OTP
4. `POST {{base_url}}/users/login/` — Copy `access` token
5. In Postman: **Authorization** → **Bearer Token** → paste token
   - Or set environment variable `access_token` and use `{{access_token}}` in auth header

### Step 3 — Book Tickets
1. `GET {{base_url}}/events/` — Find an event and note its ID and tier IDs
2. `POST {{base_url}}/bookings/` with `event` and `items` body
3. Note the returned `booking_id`

### Step 4 — Initiate & Verify eSewa Payment (Sandbox)
1. `POST {{base_url}}/bookings/{{booking_id}}/payment/initiate/`
2. Submit the returned form params to eSewa sandbox manually, or use the frontend flow
3. After eSewa returns encoded data, `POST {{base_url}}/bookings/{{booking_id}}/payment/verify/`

### Step 5 — View Issued Tickets
1. `GET {{base_url}}/me/tickets/` — View your digital QR ticket passes
