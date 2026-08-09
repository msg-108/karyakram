# Karyakram — Project Defense Prep & Draw.io Diagram Artifact

---

## Part 1: Draw.io Editable XML — Sequence Diagram

Below is the **Draw.io XML code** for a clean sequence diagram illustrating the **Ticket Booking, eSewa Payment & Check-in Flow**.

### How to use this XML in Draw.io:
1. Go to [draw.io](https://app.diagrams.net/) (or diagrams.net).
2. Click **File** ➔ **Import from** ➔ **Raw Text** (or **Arrange** ➔ **Insert** ➔ **Advanced** ➔ **XML**).
3. Paste the XML code block below and click **Insert**.
4. You will get a fully editable visual sequence diagram that you can style, export to PNG/PDF, or insert directly into your report presentation slides.

```xml
<mxfile host="app.diagrams.net" modified="2026-08-09T08:50:00.000Z" agent="Karyakram" version="21.0.0" type="device">
  <diagram id="KaryakramSequenceDiagram" name="Sequence Diagram">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#ffffff">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Lifelines -->
        <mxCell id="attendee" value="Attendee / Browser&#10;(React SPA)" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=2;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="40" width="140" height="700" as="geometry" />
        </mxCell>

        <mxCell id="backend" value="Backend API Server&#10;(Django REST)" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#d5e8d4;strokeColor=#82b366;strokeWidth=2;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="280" y="40" width="140" height="700" as="geometry" />
        </mxCell>

        <mxCell id="database" value="PostgreSQL DB&#10;(Row Locks)" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#ffe6cc;strokeColor=#d79b00;strokeWidth=2;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="500" y="40" width="140" height="700" as="geometry" />
        </mxCell>

        <mxCell id="esewa" value="eSewa Gateway&#10;(epay v2)" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#e1d5e7;strokeColor=#9673a6;strokeWidth=2;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="720" y="40" width="140" height="700" as="geometry" />
        </mxCell>

        <mxCell id="organizer" value="Organizer Scanner&#10;(@html5-qrcode)" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#f8cecc;strokeColor=#b85450;strokeWidth=2;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="940" y="40" width="140" height="700" as="geometry" />
        </mxCell>

        <!-- Messages: Booking Phase -->
        <mxCell id="m1" value="1. POST /api/bookings/ (tier_id, qty)" style="html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;strokeWidth=1.5;" edge="1" parent="1" source="attendee" target="backend">
          <mxGeometry relative="1" as="geometry"><mxPoint x="130" y="120" as="sourcePoint"/><mxPoint x="350" y="120" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m2" value="2. select_for_update() (Acquire Row Lock)" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="database">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="150" as="sourcePoint"/><mxPoint x="570" y="150" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m3" value="3. Deduct remaining_quantity &amp; Create Booking (PENDING)" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="database" target="backend">
          <mxGeometry relative="1" as="geometry"><mxPoint x="570" y="180" as="sourcePoint"/><mxPoint x="350" y="180" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m4" value="4. Return booking_id &amp; 10-min hold timer" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="attendee">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="210" as="sourcePoint"/><mxPoint x="130" y="210" as="targetPoint"/></mxGeometry>
        </mxCell>

        <!-- Messages: Payment Phase -->
        <mxCell id="m5" value="5. POST /payment/initiate/" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="attendee" target="backend">
          <mxGeometry relative="1" as="geometry"><mxPoint x="130" y="260" as="sourcePoint"/><mxPoint x="350" y="260" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m6" value="6. Generate HMAC-SHA256 signature &amp; eSewa URL" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="attendee">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="290" as="sourcePoint"/><mxPoint x="130" y="290" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m7" value="7. Form Submit / Redirect to eSewa" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="attendee" target="esewa">
          <mxGeometry relative="1" as="geometry"><mxPoint x="130" y="330" as="sourcePoint"/><mxPoint x="790" y="330" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m8" value="8. User authorizes payment &amp; eSewa redirects with data" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="esewa" target="attendee">
          <mxGeometry relative="1" as="geometry"><mxPoint x="790" y="370" as="sourcePoint"/><mxPoint x="130" y="370" as="targetPoint"/></mxGeometry>
        </mxCell>

        <!-- Messages: Verification & Ticket Issuance -->
        <mxCell id="m9" value="9. POST /payment/verify/ (data)" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="attendee" target="backend">
          <mxGeometry relative="1" as="geometry"><mxPoint x="130" y="410" as="sourcePoint"/><mxPoint x="350" y="410" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m10" value="10. Verify HMAC &amp; Update Booking (CONFIRMED)" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="database">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="440" as="sourcePoint"/><mxPoint x="570" y="440" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m11" value="11. Generate JWT QR Passes &amp; Email to Attendee" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="attendee">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="480" as="sourcePoint"/><mxPoint x="130" y="480" as="targetPoint"/></mxGeometry>
        </mxCell>

        <!-- Messages: QR Check-in Phase -->
        <mxCell id="m12" value="12. Scan Attendee Ticket QR Code" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;fontColor=#b85450;" edge="1" parent="1" source="organizer" target="organizer">
          <mxGeometry relative="1" as="geometry"><mxPoint x="1010" y="530" as="sourcePoint"/><mxPoint x="1060" y="550" as="targetPoint"/><Array as="points"><mxPoint x="1050" y="530"/><mxPoint x="1050" y="560"/></Array></mxGeometry>
        </mxCell>

        <mxCell id="m13" value="13. POST /api/events/{id}/check-in/ (qr_payload)" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="organizer" target="backend">
          <mxGeometry relative="1" as="geometry"><mxPoint x="1010" y="580" as="sourcePoint"/><mxPoint x="350" y="580" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m14" value="14. Verify JWT &amp; Update Ticket status = CHECKED_IN" style="html=1;verticalAlign=bottom;endArrow=block;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="database">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="610" as="sourcePoint"/><mxPoint x="570" y="610" as="targetPoint"/></mxGeometry>
        </mxCell>

        <mxCell id="m15" value="15. Return 200 OK (Attendee Name &amp; Check-in Time)" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeWidth=1.5;" edge="1" parent="1" source="backend" target="organizer">
          <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="650" as="sourcePoint"/><mxPoint x="1010" y="650" as="targetPoint"/></mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Part 2: Comprehensive Project Defense Question & Answer Guide

Use this section to prepare for questioning by internal and external supervisors during your Project Defense.

---

### 1. General & High-Level Questions

#### Q1: What is the main objective of the Karyakram project?
**Answer:** The primary objective of Karyakram is to build a modern, automated event management and digital ticketing platform tailored for Nepal. It eliminates manual spreadsheet workflows by offering real-time multi-tier ticket booking, race-condition-free inventory locking, automated eSewa epay v2 payment verification, inline Base64 QR code ticket delivery via email, and in-browser camera QR check-in for event organizers.

#### Q2: Why did you choose React.js for the Frontend and Django REST Framework for the Backend?
**Answer:**
- **Django REST Framework (DRF):** Provides strong database ORM abstraction, built-in security features (CSRF, password hashing, SQL injection protection), easy JWT token handling, and robust support for transaction control (`@transaction.atomic` and `select_for_update`).
- **React.js + Vite:** Enables a high-performance single-page application (SPA) experience with client-side state management (`@tanstack/react-query`), immediate dynamic UI responsiveness, and seamless integration with HTML5 web APIs like live camera QR scanning (`@html5-qrcode`).

---

### 2. Architecture & Design Questions

#### Q3: Explain the architectural pattern used in Karyakram.
**Answer:** We follow a **thin-view, service-oriented architecture**. Django views are strictly limited to decoding HTTP input, validating serializers, calling business logic functions in `services.py`, and returning HTTP responses. All core operations — such as stock locking, payment signature validation, QR code rendering, and email dispatches — are strictly encapsulated inside `services.py` modules.

#### Q4: How does Karyakram handle multi-role authorization?
**Answer:** Karyakram uses **Role-Based Access Control (RBAC)** enforced via Custom JWT Claims and DRF Permission Classes:
- `ATTENDEE` (`role: "ATTENDEE"`): Can browse events, create bookings, pay, view own tickets.
- `ORGANIZER` (`role: "ORGANIZER"`): Can create and manage own events, view revenue analytics, and access the QR check-in camera scanner (once approved by an admin).
- `ADMIN` (`is_staff: true`): Can review/approve organizer registration applications, approve or reject submitted events, and oversee overall platform statistics.

---

### 3. Concurrency, Race Conditions & Database Security

#### Q5: What is a race condition in event ticketing, and how does Karyakram prevent overbooking?
**Answer:** A race condition occurs when two or more users attempt to purchase the last remaining ticket simultaneously. If both requests read `remaining_quantity = 1` at the exact same moment, both might proceed to issue a ticket, leading to overselling (negative inventory).

Karyakram prevents this using **Database Pessimistic Locking**:
1. When a booking request is received, it executes inside a `@transaction.atomic` block.
2. It invokes `TicketTier.objects.select_for_update().filter(...)` to lock the target ticket tier rows in PostgreSQL.
3. The database forces subsequent concurrent requests to wait until the active transaction finishes.
4. The system checks `remaining_quantity >= requested_quantity`. If valid, it decrements the stock and creates a `PENDING` booking with a 10-minute hold window. Otherwise, it throws an `InsufficientStock` error (HTTP 400).

#### Q6: How do you prevent deadlocks during database locking?
**Answer:** Deadlocks occur when Transaction A locks Tier 1 and requests Tier 2, while Transaction B simultaneously locks Tier 2 and requests Tier 1. We prevent deadlocks by **sorting target primary keys in ascending order** (`order_by('id')`) before calling `select_for_update()`. This guarantees that all transactions acquire locks in the exact same deterministic sequence.

#### Q7: What happens if a user books a ticket but abandons the eSewa payment page?
**Answer:** When a booking is created, it enters a `PENDING` state with a timestamp `hold_expires_at = now() + 10 minutes`. 
- If the user does not complete the payment within 10 minutes, a background **Celery Beat** periodic worker sweeps the database every 5 minutes.
- It identifies expired pending bookings, releases the reserved tickets back to the tier's `remaining_quantity`, and sets the booking status to `EXPIRED`.

---

### 4. Payment Gateway Integration (eSewa epay v2)

#### Q8: How does Karyakram integrate with eSewa securely?
**Answer:** We integrate with eSewa's **epay v2 API** using **HMAC-SHA256 digital signatures**:
1. When initiating payment, the backend constructs a message string containing `total_amount,transaction_uuid,product_code`.
2. It signs this message using the merchant's secret key with `HMAC-SHA256` and encodes it in Base64.
3. The attendee is redirected to eSewa's portal with these signed parameters.
4. Upon payment completion, eSewa redirects back to `/payment/callback` with an encoded `data` payload.
5. The backend decodes `data`, verifies that the signature matches our secret key, verifies that the transaction status is `COMPLETE`, and checks that `total_amount` matches our database booking total before marking the booking as `CONFIRMED`.

#### Q9: How do you protect against payment tampered payloads or replay attacks?
**Answer:** 
- **Signature Validation:** If an attacker alters the `amount` or `transaction_uuid` in the URL or payload, the HMAC signature verification fails.
- **Unique Transaction UUID:** Every payment attempt generates a unique UUID (`booking-{id}-{timestamp}`). The system checks that the payment has not already been processed, preventing replay attacks.
- **Amount Verification:** The backend cross-checks the paid amount returned by eSewa against the immutable `total_amount` stored in the `Booking` database record.

---

### 5. QR Code Engine & Check-in System

#### Q10: How are QR code tickets generated and delivered?
**Answer:**
1. Upon booking confirmation (`CONFIRMED`), the backend generates a `Ticket` record for each seat.
2. A compact **JWT token** is created for each ticket containing claims: `{"t": "<ticket_uuid>", "e": <event_id>, "exp": <event_end_timestamp>}`.
3. The Python `qrcode` library renders a **Version 2 (25×25 matrix) PNG** image (`box_size=16`, `border=2`, `ERROR_CORRECT_M`).
4. The PNG image is converted into a **Base64 Data URI** string (`data:image/png;base64,...`) and embedded directly inline into the HTML confirmation email.
5. This eliminates dependency on third-party image hosting servers and ensures tickets display instantly even when offline.

#### Q11: How does the organizer QR scanner work, and how do you prevent ticket reuse (anti-passback)?
**Answer:**
1. The organizer logs into `/organizer/check-in` on a mobile device or laptop.
2. The `@html5-qrcode` React component activates the device camera to read live video.
3. Upon scanning a ticket QR code, the raw JWT payload is sent to `POST /api/events/{event_id}/check-in/`.
4. The backend verifies the JWT cryptographic signature, verifies that `ticket.event_id == event_id`, and checks `ticket.status`.
5. If `ticket.status == 'VALID'`, it updates the status to `'CHECKED_IN'`, records `checked_in_at = now()`, and returns HTTP 200 OK.
6. If the ticket is scanned a second time, the backend detects `ticket.status == 'CHECKED_IN'` and rejects the scan with HTTP 400 Bad Request: `"WARNING: Ticket has already been checked in!"`.

---

### 6. Testing, Limitations & Future Work

#### Q12: How did you test the system?
**Answer:** We conducted unit, integration, and manual end-to-end testing:
- **Backend Unit Tests:** Written using Django `TestCase` and `TransactionTestCase`. 31 automated tests pass cleanly, covering user registration, OTP verification, event CRUD, row-level locking, eSewa signature generation, payment verification, and ticket QR check-in.
- **API Testing:** Executed via Postman collection for all endpoints, edge cases (invalid OTP, expired holds, out-of-stock purchases), and permission checks.

#### Q13: What are the current limitations of Karyakram?
**Answer:**
1. **Payment Gateways:** Currently supports eSewa (epay v2); Khalti and Fonepay integration can be added in future iterations.
2. **Offline Check-in:** Organizer QR verification currently requires an active internet connection to perform stateful validation against PostgreSQL.

#### Q14: What future enhancements do you plan for Karyakram?
**Answer:**
- Offline QR check-in syncing using local browser IndexedDB storage and cryptographic pubkey verification.
- Seating map selection UI for theater and stadium events.
- Push notification system via WebSockets / Firebase Cloud Messaging (FCM).
- Additional payment gateway integrations (Khalti, Fonepay, Visa/Mastercard).
