"""
Database models for the users app.

Two models:
- User: single custom user model (extends AbstractUser) for both USER and
  ORGANIZER roles, plus Django's built-in is_staff/is_superuser for admins.
- OrganizerProfile: organizer-only fields (business info, documents, bank
  details), linked one-to-one to User. Only ever created for role=ORGANIZER.
"""
from __future__ import annotations

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from secrets import randbelow


from .validators import (
    validate_bank_account_number,
    validate_citizenship_number,
    validate_organizer_document,
    validate_pan_number,
    validate_username_format,
)


class User(AbstractUser):
    """
    Custom user model shared by regular users and organizers.

    Role is a plain choices field, not a separate model, because the two
    roles share the same login flow, the same JWT auth, and almost all of
    the same account-lifecycle fields (verification, activation). Only
    organizer-specific data lives elsewhere, in OrganizerProfile.
    """

    class Role(models.TextChoices):
        USER = "USER", "User"
        ORGANIZER = "ORGANIZER", "Organizer"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    # Redeclare `username` (already defined on AbstractUser) purely to
    # layer our stricter format validator alongside Django's own one.
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[ validate_username_format],
        help_text="Required. 3-30 characters. Letters, digits, dot, underscore, hyphen only.",
    )

    # --- Email verification (OTP based) ---
    is_email_verified = models.BooleanField(default=False)

    # --- Organizer approval ---
    # Only meaningful when role == ORGANIZER. A regular USER is never
    # "pending approval", so this stays False/unused for that role.
    is_approved = models.BooleanField(
        default=False,
        help_text="Organizer-only. Set True once an admin approves the organizer.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["is_active", "is_email_verified"]),
        ]

    def __str__(self) -> str:
        return f"{self.username} ({self.email})"

    @property
    def is_organizer(self) -> bool:
        return self.role == self.Role.ORGANIZER

    @property
    def is_pending_organizer_approval(self) -> bool:
        return self.is_organizer and self.is_email_verified and not self.is_approved


class OrganizerProfile(models.Model):
    """
    Organizer-specific data, kept off the User model so that:
      - regular users never carry unused organizer columns
      - sensitive fields (citizenship/PAN/bank) are isolated and easy to
        encrypt/audit/restrict access to independently of the User table
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organizer_profile",
    )

    organization_name = models.CharField(max_length=255)
    organization_description = models.TextField(blank=True)
    website_url = models.URLField(blank=True)

    # --- Encrypted sensitive fields (application-layer encryption) ---
    # Not unique/searchable by design — encrypted ciphertext is
    # non-deterministic per django-encrypted-model-fields, so uniqueness
    # constraints and lookups against these fields are not reliable.
    citizenship_number = models.CharField(
        max_length=255, validators=[validate_citizenship_number]
    )
    pan_number = models.CharField(max_length=255, validators=[validate_pan_number])
    bank_account_number = models.CharField(
        max_length=255, validators=[validate_bank_account_number]
    )
    bank_name = models.CharField(max_length=255)

    # --- Verification documents ---
    citizenship_document = models.FileField(
        upload_to="organizers/documents/citizenship/",
        validators=[validate_organizer_document],
        help_text="Citizenship certificate (image or PDF).",
    )
    pan_document = models.FileField(
        upload_to="organizers/documents/pan/",
        validators=[validate_organizer_document],
        help_text="PAN card (image or PDF).",
    )

    # --- Admin review trail ---
    approval_requested_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organizers_approved",
    )
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizer_profiles"
        verbose_name = "Organizer Profile"
        verbose_name_plural = "Organizer Profiles"
        ordering = ["-approval_requested_at"]

    def __str__(self) -> str:
        return f"{self.organization_name} ({self.user.username})"

def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return f"{randbelow(1_000_000):06d}"


class EmailOTP(models.Model):
    """
    One active OTP per user per purpose. A new OTP request (register/resend)
    overwrites the previous row via get_or_create + reset, rather than
    accumulating history — old codes must stop working immediately, and
    there is nothing OTP history is used for beyond the current cycle.
    """

    class Purpose(models.TextChoices):
        EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verification"
        PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"

    OTP_LENGTH = 6

    OTP_VALIDITY_MINUTES = settings.OTP_VALIDITY_MINUTES

    RESEND_COOLDOWN_SECONDS = settings.OTP_RESEND_COOLDOWN_SECONDS

    MAX_ATTEMPTS = settings.OTP_MAX_ATTEMPTS

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps"
    )
    purpose = models.CharField(max_length=30, choices=Purpose.choices)
    code = models.CharField(max_length=OTP_LENGTH, default=generate_otp)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_otps"
        verbose_name = "Email OTP"
        verbose_name_plural = "Email OTPs"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "purpose"], name="unique_active_otp_per_purpose"
            )
        ]

    def __str__(self) -> str:
        return f"OTP({self.purpose}) for {self.user.email}"

    @property
    def is_expired(self) -> bool:
        age = timezone.now() - self.created_at
        return age.total_seconds() > self.OTP_VALIDITY_MINUTES * 60

    @property
    def seconds_until_resend_allowed(self) -> int:
        elapsed = (timezone.now() - self.last_sent_at).total_seconds()
        remaining = self.RESEND_COOLDOWN_SECONDS - elapsed
        return max(0, int(remaining))

    @property
    def attempts_remaining(self) -> int:
        return max(0, self.MAX_ATTEMPTS - self.attempts)