from django.test import TransactionTestCase
from rest_framework.exceptions import ValidationError, PermissionDenied
from apps.users.models import User, OrganizerProfile
from apps.users.services import (
    register_organizer,
    approve_organizer,
    reject_organizer,
    assert_can_login,
    verify_email_otp,
    issue_otp,
)
from apps.common.tests.factories import UserFactory

from django.core.files.uploadedfile import SimpleUploadedFile


class UserServicesTest(TransactionTestCase):
    def test_register_organizer_creates_unapproved_inactive_user(self):
        validated_data = {
            "username": "org_test",
            "email": "org_test@example.com",
            "password": "password123",
            "first_name": "Org",
            "last_name": "Test",
        }

        dummy_file = SimpleUploadedFile(
            "doc.pdf", b"file_content", content_type="application/pdf"
        )

        profile_data = {
            "organization_name": "Test Org",
            "organization_description": "We do test events.",
            "citizenship_number": "123456",
            "pan_number": "123456789",
            "bank_account_number": "0000000000",
            "bank_name": "Test Bank",
            "citizenship_document": dummy_file,
            "pan_document": dummy_file,
        }

        user = register_organizer(
            validated_data=validated_data, profile_data=profile_data
        )

        self.assertEqual(user.role, User.Role.ORGANIZER)
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_approved)
        self.assertFalse(user.is_email_verified)

        # Test assert_can_login stops unverified user
        with self.assertRaises(ValidationError) as ctx:
            assert_can_login(user)
        self.assertIn("verify your email", str(ctx.exception))

    def test_verify_email_otp_does_not_activate_organizer(self):
        # Create unverified organizer
        user = User.objects.create(
            username="org2",
            email="org2@test.com",
            role=User.Role.ORGANIZER,
            is_active=False,
            is_approved=False,
        )
        profile = OrganizerProfile.objects.create(
            user=user, organization_name="Test Org 2"
        )
        otp = issue_otp(user, purpose="EMAIL_VERIFICATION")

        result = verify_email_otp(user, code=otp.code)

        self.assertTrue(user.is_email_verified)
        self.assertFalse(user.is_active)  # Still inactive until approved

        # Test assert_can_login stops unapproved organizer
        with self.assertRaises(PermissionDenied) as ctx:
            assert_can_login(user)
        self.assertIn("pending admin approval", str(ctx.exception))

    def test_approve_organizer_activates_user(self):
        user = User.objects.create(
            username="org3",
            email="org3@test.com",
            role=User.Role.ORGANIZER,
            is_active=False,
            is_email_verified=True,
            is_approved=False,
        )
        profile = OrganizerProfile.objects.create(
            user=user, organization_name="Test Org 3"
        )
        admin = UserFactory(is_superuser=True)

        approve_organizer(profile, admin=admin)

        user.refresh_from_db()
        self.assertTrue(user.is_approved)
        self.assertTrue(user.is_active)

        # Now they can login
        assert_can_login(user)  # Should not raise

    def test_reject_organizer_removes_account_data(self):
        user = User.objects.create(
            username="org4",
            email="org4@test.com",
            role=User.Role.ORGANIZER,
            is_active=True,
            is_email_verified=True,
            is_approved=True,
        )
        profile = OrganizerProfile.objects.create(
            user=user, organization_name="Test Org 4"
        )
        admin = UserFactory(is_superuser=True)

        reject_organizer(profile, admin=admin, reason="Incomplete information.")

        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertFalse(OrganizerProfile.objects.filter(pk=profile.pk).exists())
