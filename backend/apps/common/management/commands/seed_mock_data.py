import uuid
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.users.models import User, OrganizerProfile, EmailOTP
from apps.events.models import EventCategory, Event, TicketTier, EventImage
from apps.bookings.models import Booking, BookingItem
from apps.payments.models import Payment
from apps.tickets.models import Ticket
from apps.tickets.services import generate_qr_jwt


class Command(BaseCommand):
    help = "Clears existing non-admin data and seeds rich, realistic mock data for testing."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting database cleanup..."))

        # 1. Clear existing non-admin records in correct dependency order
        Ticket.objects.all().delete()
        Payment.objects.all().delete()
        BookingItem.objects.all().delete()
        Booking.objects.all().delete()
        TicketTier.objects.all().delete()
        EventImage.objects.all().delete()
        Event.objects.all().delete()
        EventCategory.objects.all().delete()
        OrganizerProfile.objects.all().delete()
        EmailOTP.objects.all().delete()

        # Delete non-admin users
        deleted_users_count, _ = User.objects.filter(
            is_superuser=False, is_staff=False
        ).delete()
        self.stdout.write(
            self.style.SUCCESS(f"Cleaned database. Deleted {deleted_users_count} non-admin user(s).")
        )

        # 2. Ensure Admin User Exists
        admin_user = User.objects.filter(is_superuser=True).first() or User.objects.filter(is_staff=True).first()
        if not admin_user:
            admin_user = User.objects.create(
                email="admin@karyakram.com",
                username="admin",
                first_name="System",
                last_name="Administrator",
                role=User.Role.USER,
                is_superuser=True,
                is_staff=True,
                is_active=True,
                is_email_verified=True,
                is_approved=True,
            )
            admin_user.set_password("Admin@123")
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created superuser: admin@karyakram.com / Admin@123"))
        else:
            admin_user.is_active = True
            admin_user.is_email_verified = True
            admin_user.is_approved = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Preserved existing admin: {admin_user.email} (Username: {admin_user.username})"))

        # 3. Seed Event Categories
        categories_data = [
            {
                "name": "Music & Festivals",
                "slug": "music-festivals",
                "icon": "Music",
                "description": "Live concerts, musical performances, and cultural music festivals across Nepal.",
            },
            {
                "name": "Technology & Startups",
                "slug": "tech-startups",
                "icon": "Cpu",
                "description": "Tech conferences, AI summits, hackathons, and developer meetups.",
            },
            {
                "name": "Food & Culinary",
                "slug": "food-culinary",
                "icon": "Utensils",
                "description": "Food carnivals, craft beverage tastings, and Nepalese culinary workshops.",
            },
            {
                "name": "Sports & Outdoor",
                "slug": "sports-outdoor",
                "icon": "Trophy",
                "description": "Marathons, futsal tournaments, adventure sports, and trekking fests.",
            },
            {
                "name": "Workshops & Education",
                "slug": "workshops-education",
                "icon": "BookOpen",
                "description": "Professional masterclasses, skill workshops, and educational seminars.",
            },
            {
                "name": "Arts & Culture",
                "slug": "arts-culture",
                "icon": "Palette",
                "description": "Theater plays, art exhibitions, heritage tours, and photography fests.",
            },
        ]

        category_map = {}
        for cat_info in categories_data:
            cat = EventCategory.objects.create(**cat_info)
            category_map[cat.slug] = cat
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(category_map)} event categories."))

        # 4. Seed Approved Organizers
        organizers_info = [
            {
                "email": "ktmlive@karyakram.com",
                "username": "ktmlive",
                "first_name": "KTM",
                "last_name": "Live",
                "company_name": "KTM Live Productions",
                "bio": "Premier live concert, music festival, and mega event organizer based in Kathmandu.",
                "city": "Kathmandu",
                "phone": "+977-9801234567",
                "website": "https://ktmlive.np",
            },
            {
                "email": "tech@himalayansummits.com",
                "username": "techhimalaya",
                "first_name": "Himalayan",
                "last_name": "Tech",
                "company_name": "Himalayan Tech Summits",
                "bio": "Connecting global technology leaders, AI researchers, and Nepalese innovators.",
                "city": "Lalitpur",
                "phone": "+977-9841234568",
                "website": "https://techhimalaya.org",
            },
            {
                "email": "info@pokharasound.com",
                "username": "pokharasound",
                "first_name": "Pokhara",
                "last_name": "Sound",
                "company_name": "Pokhara Sound Wave",
                "bio": "Lakeside music festivals, acoustic open-air concerts, and cultural gatherings.",
                "city": "Pokhara",
                "phone": "+977-9861234569",
                "website": "https://pokharasound.com",
            },
        ]

        organizer_profiles = {}
        for org in organizers_info:
            user = User.objects.create(
                email=org["email"],
                username=org["username"],
                first_name=org["first_name"],
                last_name=org["last_name"],
                role=User.Role.ORGANIZER,
                is_email_verified=True,
                is_approved=True,
                is_active=True,
            )
            user.set_password("Pass@123")
            user.save()

            profile = OrganizerProfile.objects.create(
                user=user,
                organization_name=org["company_name"],
                organization_description=org["bio"],
                website_url=org["website"],
                citizenship_number="12-34-56-7890",
                pan_number="123456789",
                bank_name="Nabil Bank Ltd",
                bank_account_number="0123456789012",
                citizenship_document="organizers/documents/citizenship/sample.pdf",
                pan_document="organizers/documents/pan/sample.pdf",
            )
            organizer_profiles[org["username"]] = profile

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(organizer_profiles)} approved organizer accounts (Password: Pass@123)."))

        # 5. Seed Regular Attendee Users
        attendees_info = [
            {"email": "aarav@example.com", "username": "aaravsharma", "first_name": "Aarav", "last_name": "Sharma"},
            {"email": "sita@example.com", "username": "sitagharti", "first_name": "Sita", "last_name": "Gharti"},
            {"email": "bibek@example.com", "username": "bibekshrestha", "first_name": "Bibek", "last_name": "Shrestha"},
        ]

        attendee_users = []
        for att in attendees_info:
            user = User.objects.create(
                email=att["email"],
                username=att["username"],
                first_name=att["first_name"],
                last_name=att["last_name"],
                role=User.Role.USER,
                is_email_verified=True,
                is_active=True,
            )
            user.set_password("Pass@123")
            user.save()
            attendee_users.append(user)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(attendee_users)} attendee accounts (Password: Pass@123)."))

        # 6. Seed Events & Ticket Tiers
        now = timezone.now()

        events_data = [
            {
                "organizer": organizer_profiles["ktmlive"],
                "category": category_map["music-festivals"],
                "title": "Kathmandu International Music Fest 2026",
                "slug": "kathmandu-international-music-fest-2026",
                "short_description": "Nepal's premier 2-day musical extravaganza featuring top national and international artists.",
                "description": "Join us at Tundikhel Ground for two unforgettable days of music, lights, food stalls, and immersive soundscapes! Featuring headliner bands across rock, pop, folk fusion, and EDM.",
                "terms_and_conditions": "Must be 16+. Valid ID required at entrance. No outside food or beverages.",
                "venue": "Tundikhel Open Ground",
                "address": "Kantipath, New Road",
                "city": "Kathmandu",
                "district": "Kathmandu",
                "province": "Bagmati",
                "latitude": Decimal("27.700769"),
                "longitude": Decimal("85.315340"),
                "start_datetime": now + timedelta(days=14, hours=4),
                "end_datetime": now + timedelta(days=14, hours=12),
                "capacity": 5000,
                "status": Event.Status.PUBLISHED,
                "visibility": Event.Visibility.PUBLIC,
                "published_at": now - timedelta(days=2),
                "tiers": [
                    {"name": "Early Bird General Admission", "price": Decimal("800.00"), "quantity": 300, "remaining_quantity": 250},
                    {"name": "Standard General Admission", "price": Decimal("1500.00"), "quantity": 1500, "remaining_quantity": 1400},
                    {"name": "VIP Front-Stage Pass", "price": Decimal("3500.00"), "quantity": 200, "remaining_quantity": 180},
                ],
            },
            {
                "organizer": organizer_profiles["techhimalaya"],
                "category": category_map["tech-startups"],
                "title": "Nepal AI & Tech Summit 2026",
                "slug": "nepal-ai-tech-summit-2026",
                "short_description": "The biggest technology, artificial intelligence, and startup convention in the Himalayas.",
                "description": "Explore state-of-the-art developments in generative AI, cloud computing, cybersecurity, and tech entrepreneurship. Keynote speeches by international guest engineers and interactive workshops.",
                "terms_and_conditions": "Laptop recommended for workshop sessions. Ticket includes lunch and networking lounge access.",
                "venue": "Heritage Garden Conference Center",
                "address": "Sanepa Height",
                "city": "Lalitpur",
                "district": "Lalitpur",
                "province": "Bagmati",
                "latitude": Decimal("27.683333"),
                "longitude": Decimal("85.316667"),
                "start_datetime": now + timedelta(days=21, hours=2),
                "end_datetime": now + timedelta(days=22, hours=8),
                "capacity": 800,
                "status": Event.Status.PUBLISHED,
                "visibility": Event.Visibility.PUBLIC,
                "published_at": now - timedelta(days=1),
                "tiers": [
                    {"name": "Developer / Student Pass", "price": Decimal("1200.00"), "quantity": 400, "remaining_quantity": 370},
                    {"name": "All-Access Summit Pass", "price": Decimal("2500.00"), "quantity": 250, "remaining_quantity": 230},
                ],
            },
            {
                "organizer": organizer_profiles["pokharasound"],
                "category": category_map["food-culinary"],
                "title": "Lakeside Food & Acoustic Fest",
                "slug": "lakeside-food-acoustic-fest",
                "short_description": "A delightful evening of Nepalese food fusion, craft mocktails, and live acoustic music by Phewa Lake.",
                "description": "Indulge your palate with 30+ artisan food stalls representing street delicacies from across Nepal, accompanied by soulful acoustic performances by the lake.",
                "terms_and_conditions": "Ticket includes 1 complimentary signature drink and food tasting voucher.",
                "venue": "Barahi Ghat Open Park",
                "address": "Lakeside Street 16",
                "city": "Pokhara",
                "district": "Kaski",
                "province": "Gandaki",
                "latitude": Decimal("28.209600"),
                "longitude": Decimal("83.958600"),
                "start_datetime": now + timedelta(days=7, hours=5),
                "end_datetime": now + timedelta(days=7, hours=11),
                "capacity": 1200,
                "status": Event.Status.PUBLISHED,
                "visibility": Event.Visibility.PUBLIC,
                "published_at": now - timedelta(days=3),
                "tiers": [
                    {"name": "General Festival Ticket", "price": Decimal("500.00"), "quantity": 800, "remaining_quantity": 760},
                    {"name": "Gourmet Tasting Experience", "price": Decimal("1800.00"), "quantity": 150, "remaining_quantity": 140},
                ],
            },
            {
                "organizer": organizer_profiles["ktmlive"],
                "category": category_map["sports-outdoor"],
                "title": "Kathmandu Valley Run 2026",
                "slug": "kathmandu-valley-run-2026",
                "short_description": "Join thousands of runners in the annual 10k & 21k half marathon through historic Kathmandu streets.",
                "description": "Run for health and community! Fully marshaled route, hydration stations every 2.5km, timing chips, finisher medals, and post-run breakfast celebration.",
                "terms_and_conditions": "Medical waiver must be signed at bib pickup. Bib collection starts 2 days before the event.",
                "venue": "Dasarath Rangasala Stadium",
                "address": "Tripureshwor",
                "city": "Kathmandu",
                "district": "Kathmandu",
                "province": "Bagmati",
                "latitude": Decimal("27.694600"),
                "longitude": Decimal("85.314900"),
                "start_datetime": now + timedelta(days=30, hours=1),
                "end_datetime": now + timedelta(days=30, hours=6),
                "capacity": 2000,
                "status": Event.Status.PUBLISHED,
                "visibility": Event.Visibility.PUBLIC,
                "published_at": now - timedelta(days=4),
                "tiers": [
                    {"name": "10k Run Registration", "price": Decimal("600.00"), "quantity": 1000, "remaining_quantity": 980},
                    {"name": "21k Half-Marathon Registration", "price": Decimal("1000.00"), "quantity": 500, "remaining_quantity": 480},
                ],
            },
            {
                "organizer": organizer_profiles["techhimalaya"],
                "category": category_map["workshops-education"],
                "title": "Modern Web & Cloud Systems Masterclass",
                "slug": "modern-web-cloud-systems-masterclass",
                "short_description": "An intensive hands-on masterclass covering distributed microservices and modern frontend design.",
                "description": "Learn production-grade system architecture, containerization with Docker & Kubernetes, and real-time backend engineering.",
                "terms_and_conditions": "Prerequisite: Basic programming experience in Python or JavaScript.",
                "venue": "Hotel Himalaya Tech Hall",
                "address": "Kupondole",
                "city": "Lalitpur",
                "district": "Lalitpur",
                "province": "Bagmati",
                "start_datetime": now + timedelta(days=40, hours=3),
                "end_datetime": now + timedelta(days=40, hours=8),
                "capacity": 100,
                "status": Event.Status.SUBMITTED,  # Pending admin review for moderation testing!
                "visibility": Event.Visibility.PUBLIC,
                "tiers": [
                    {"name": "Masterclass Pass", "price": Decimal("2200.00"), "quantity": 100, "remaining_quantity": 100},
                ],
            },
        ]

        created_events = []
        for ev_info in events_data:
            tiers_info = ev_info.pop("tiers")
            event = Event.objects.create(**ev_info)

            for tier_info in tiers_info:
                TicketTier.objects.create(event=event, **tier_info)

            created_events.append(event)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_events)} events with ticket tiers."))

        # 7. Seed Sample Booking, Payment, & QR Ticket for Attendee (Aarav Sharma)
        sample_event = created_events[0]
        sample_tier = sample_event.ticket_tiers.first()
        sample_user = attendee_users[0]

        booking = Booking.objects.create(
            user=sample_user,
            event=sample_event,
            status=Booking.Status.CONFIRMED,
            total_amount=sample_tier.price * 2,
        )

        booking_item = BookingItem.objects.create(
            booking=booking,
            ticket_tier=sample_tier,
            quantity=2,
            price_at_purchase=sample_tier.price,
        )

        payment = Payment.objects.create(
            booking=booking,
            amount=booking.total_amount,
            status=Payment.Status.COMPLETED,
            provider=Payment.Provider.ESEWA,
            transaction_id=f"ESEWA-MOCK-{uuid.uuid4().hex[:8].upper()}",
        )

        # Generate QR tickets for Aarav
        for i in range(2):
            t_id = uuid.uuid4()
            ticket = Ticket.objects.create(
                id=t_id,
                booking=booking,
                booking_item=booking_item,
                attendee_name=f"{sample_user.get_full_name()} (Guest #{i+1})",
                attendee_email=sample_user.email,
                status=Ticket.Status.VALID,
            )
            ticket.qr_code_payload = generate_qr_jwt(ticket)
            ticket.save(update_fields=["qr_code_payload"])

        self.stdout.write(self.style.SUCCESS(f"Seeded sample confirmed booking & QR tickets for user {sample_user.email}."))

        self.stdout.write(self.style.SUCCESS("\n========================================================"))
        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
        self.stdout.write(self.style.SUCCESS("Logins available for testing:"))
        self.stdout.write(self.style.SUCCESS("  - Superadmin: admin@karyakram.com / Admin@123"))
        self.stdout.write(self.style.SUCCESS("  - Organizer 1: ktmlive@karyakram.com / Pass@123"))
        self.stdout.write(self.style.SUCCESS("  - Organizer 2: tech@himalayansummits.com / Pass@123"))
        self.stdout.write(self.style.SUCCESS("  - Organizer 3: info@pokharasound.com / Pass@123"))
        self.stdout.write(self.style.SUCCESS("  - Attendee 1: aarav@example.com / Pass@123"))
        self.stdout.write(self.style.SUCCESS("  - Attendee 2: sita@example.com / Pass@123"))
        self.stdout.write(self.style.SUCCESS("========================================================\n"))
