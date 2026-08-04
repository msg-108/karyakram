"""
Business logic for the users app. Views stay thin and call these; models
and serializers stay dumb. Each service raises DRF's ValidationError (or a
subclass) on failure so views can let exceptions propagate to DRF's default
exception handler rather than re-wrapping responses themselves.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.common.email import send_email
from .models import EmailOTP, OrganizerProfile, User, generate_otp

logger = logging.getLogger(__name__)


# ==================== EMAIL SENDING ====================


def send_otp_email(user: User, otp: EmailOTP) -> None:
    send_email(
        to=user.email,
        subject="Your Karyakram verification code",
        template_prefix="emails/otp_verification",
        context={
            "user": user,
            "otp_code": otp.code,
            "valid_minutes": EmailOTP.OTP_VALIDITY_MINUTES,
            "resend_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        },
        user=user,
    )


def send_organizer_approved_email(user: User) -> None:
    send_email(
        to=user.email,
        subject="Your organizer account has been approved",
        template_prefix="emails/organizer_approved",
        context={"user": user},
        user=user,
    )


def send_organizer_rejected_email(user: User, reason: str) -> None:
    send_email(
        to=user.email,
        subject="Update on your organizer application",
        template_prefix="emails/organizer_rejected",
        context={"user": user, "reason": reason},
        user=user,
    )


def send_ticket_email(user: User, *, event_name: str, ticket_pdf_bytes: bytes, ticket_filename: str) -> None:
    """
    Deliver a ticket after successful payment. Kept here (rather than in a
    future `tickets` app) per the requirements doc, which lists "ticket
    email sending" as a users-app responsibility; the tickets/payments apps
    themselves are explicitly deferred.
    """
    send_email(
        to=user.email,
        subject=f"Your ticket for {event_name}",
        template_prefix="emails/ticket_delivery",
        context={"user": user, "event_name": event_name},
        attachments=[(ticket_filename, ticket_pdf_bytes, "application/pdf")],
        user=user,
    )


# ==================== REGISTRATION ====================


@transaction.atomic
def register_user(*, validated_data: dict) -> User:
    """Create an inactive, unverified USER and send the first OTP."""
    password = validated_data.pop("password")
    user = User(role=User.Role.USER, is_active=False, **validated_data)
    user.set_password(password)
    user.full_clean(exclude=["password"])
    user.save()

    otp = issue_otp(user, purpose=EmailOTP.Purpose.EMAIL_VERIFICATION)

    transaction.on_commit(
        lambda: send_otp_email(user, otp)
    )

    return user


@transaction.atomic
def register_organizer(*, validated_data: dict, profile_data: dict) -> User:
    """
    Create an inactive, unverified ORGANIZER plus its OrganizerProfile, and
    send the first OTP. Both rows are created together, atomically — an
    organizer must never exist without a profile, or vice versa.
    """
    password = validated_data.pop("password")
    user = User(role=User.Role.ORGANIZER, is_active=False, **validated_data)
    user.set_password(password)
    user.full_clean(exclude=["password"])
    user.save()

    profile = OrganizerProfile(user=user, **profile_data)
    profile.full_clean()
    profile.save()

    otp = issue_otp(user, purpose=EmailOTP.Purpose.EMAIL_VERIFICATION)

    transaction.on_commit(
        lambda: send_otp_email(user, otp)
    )

    return user


# ==================== OTP ====================


@dataclass(frozen=True)
class OTPVerificationResult:
    user: User
    activated: bool


def issue_otp(user: User, *, purpose: str) -> EmailOTP:
    """
    Create or reset the single active OTP row for (user, purpose). Reset
    rather than insert-new because of the unique_active_otp_per_purpose
    constraint — a user only ever has one live code per purpose at a time.
    """
    otp, created = EmailOTP.objects.get_or_create(user=user, purpose=purpose)
    if not created:
        otp.code = generate_otp()
        otp.attempts = 0
        otp.created_at = timezone.now()
        otp.last_sent_at = timezone.now()
        otp.save(update_fields=["code", "attempts", "created_at", "last_sent_at"])
    return otp


def resend_otp(user: User, *, purpose: str) -> EmailOTP:
    try:
        existing = EmailOTP.objects.get(user=user, purpose=purpose)
    except EmailOTP.DoesNotExist:
        otp = issue_otp(user, purpose=purpose)
        send_otp_email(user, otp)
        return otp

    remaining = existing.seconds_until_resend_allowed
    if remaining > 0:
        raise ValidationError(
            {"detail": f"Please wait {remaining} seconds before requesting a new code."}
        )

    otp = issue_otp(user, purpose=purpose)
    send_otp_email(user, otp)
    return otp


@transaction.atomic
def verify_otp(user: User, *, code: str, purpose: str) -> OTPVerificationResult:
    """
    Validate the submitted code. On success: mark email verified, activate
    USER accounts immediately (ORGANIZER accounts stay inactive pending
    admin approval — see `is_pending_organizer_approval`), and delete the
    OTP row so it cannot be reused, per requirement #11.
    """
    try:
        otp = EmailOTP.objects.select_for_update().get(user=user, purpose=purpose)
    except EmailOTP.DoesNotExist:
        raise ValidationError({"code": "No verification code found. Please request a new one."})

    if otp.is_expired:
        otp.delete()
        raise ValidationError({"code": "This code has expired. Please request a new one."})

    if otp.attempts_remaining <= 0:
        otp.delete()
        raise ValidationError({"code": "Too many incorrect attempts. Please request a new code."})

    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        raise ValidationError(
            {"code": f"Incorrect code. {otp.attempts_remaining} attempt(s) remaining."}
        )

    user.is_email_verified = True
    activated = False
    if user.role == User.Role.USER:
        user.is_active = True
        activated = True
    # ORGANIZER: is_active stays False until an admin approves.
    user.save(update_fields=["is_email_verified", "is_active"])
    otp.delete()

    return OTPVerificationResult(user=user, activated=activated)


# ==================== LOGIN GATING ====================


def assert_can_login(user: User) -> None:
    """
    Centralizes requirement #9's three rejection reasons so both the
    custom TokenObtainPairSerializer and any future login path (e.g. social
    auth) enforce identical rules. Raises rather than returning a bool so
    the caller doesn't need its own branching/messages.
    """
    if not user.is_email_verified:
        raise ValidationError({"detail": "Please verify your email before logging in."})

    if user.is_organizer and not user.is_approved:
        raise PermissionDenied(
            "Your organizer account is pending admin approval."
        )

    if not user.is_active:
        # Deliberately checked last: for an unapproved organizer, is_active
        # is also False, but the approval message above is more useful and
        # should take precedence over this generic one.
        raise ValidationError({"detail": "This account is inactive."})


# ==================== ORGANIZER APPROVAL ====================


@transaction.atomic
def approve_organizer(profile: OrganizerProfile, *, admin: User) -> OrganizerProfile:
    user = profile.user
    user.is_approved = True
    user.is_active = True
    user.save(update_fields=["is_approved", "is_active"])

    profile.approved_at = timezone.now()
    profile.approved_by = admin
    profile.rejection_reason = ""
    profile.save(update_fields=["approved_at", "approved_by", "rejection_reason"])

    transaction.on_commit(
        lambda: send_organizer_approved_email(user)
    )
    return profile


@transaction.atomic
def reject_organizer(profile: OrganizerProfile, *, admin: User, reason: str) -> OrganizerProfile:
    if not reason.strip():
        raise ValidationError({"reason": "A rejection reason is required."})

    user = profile.user
    user.is_approved = False
    user.is_active = False
    user.save(update_fields=["is_approved", "is_active"])

    profile.approved_at = None
    profile.approved_by = admin
    profile.rejection_reason = reason
    profile.save(update_fields=["approved_at", "approved_by", "rejection_reason"])

    transaction.on_commit(
        lambda: send_organizer_rejected_email(user, reason)
    )
    return profile