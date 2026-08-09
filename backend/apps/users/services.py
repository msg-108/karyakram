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
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.common.email import send_email
from .models import EmailOTP, OrganizerProfile, User, generate_otp

logger = logging.getLogger(__name__)


# ==================== EMAIL SENDING ====================


def send_otp_email(user: User, otp: EmailOTP) -> None:
    logger.info("Generated verification OTP for %s: %s", user.email, otp.code)
    print(f"\n==================================================\n[EMAIL OTP] Code for {user.username} ({user.email}): {otp.code}\n==================================================\n", flush=True)
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


def send_welcome_email(user: User) -> None:
    send_email(
        to=user.email,
        subject="Welcome to Karyakram!",
        template_prefix="emails/welcome",
        context={"user": user},
        user=user,
    )


def send_admin_organizer_pending_email(profile: OrganizerProfile) -> None:
    # Get all superusers or a configured admin email
    admin_emails = User.objects.filter(is_superuser=True, is_active=True).values_list(
        "email", flat=True
    )
    if not admin_emails:
        admin_emails = [settings.DEFAULT_FROM_EMAIL]

    for admin_email in admin_emails:
        send_email(
            to=admin_email,
            subject="New Organizer Application Pending",
            template_prefix="emails/admin_organizer_pending",
            context={"profile": profile},
            user=profile.user,
        )


def send_password_reset_email(user: User, otp: EmailOTP) -> None:
    logger.info("Generated password reset OTP for %s: %s", user.email, otp.code)
    print(f"\n==================================================\n[PASSWORD RESET OTP] Code for {user.username} ({user.email}): {otp.code}\n==================================================\n", flush=True)
    send_email(
        to=user.email,
        subject="Reset your Karyakram password",
        template_prefix="emails/password_reset",
        context={
            "user": user,
            "otp_code": otp.code,
            "valid_minutes": EmailOTP.OTP_VALIDITY_MINUTES,
        },
        user=user,
    )


def send_password_reset_success_email(user: User) -> None:
    send_email(
        to=user.email,
        subject="Your Karyakram password was changed",
        template_prefix="emails/password_reset_success",
        context={"user": user},
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

    transaction.on_commit(lambda: send_otp_email(user, otp))

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

    transaction.on_commit(lambda: send_otp_email(user, otp))
    transaction.on_commit(lambda: send_admin_organizer_pending_email(profile))

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


def _dispatch_otp_email(user: User, otp: EmailOTP, purpose: str) -> None:
    if purpose == EmailOTP.Purpose.PASSWORD_RESET:
        send_password_reset_email(user, otp)
    else:
        send_otp_email(user, otp)


def resend_otp(user: User, *, purpose: str) -> EmailOTP:
    try:
        existing = EmailOTP.objects.get(user=user, purpose=purpose)
    except EmailOTP.DoesNotExist:
        otp = issue_otp(user, purpose=purpose)
        _dispatch_otp_email(user, otp, purpose)
        return otp

    remaining = existing.seconds_until_resend_allowed
    if remaining > 0:
        raise ValidationError(
            {"detail": f"Please wait {remaining} seconds before requesting a new code."}
        )

    otp = issue_otp(user, purpose=purpose)
    _dispatch_otp_email(user, otp, purpose)
    return otp


def _validate_otp(user: User, *, code: str, purpose: str) -> EmailOTP:
    """
    Core validation logic: fetches the row with row-level lock, checks
    expiration, checks attempts, and matches the code. Returns the OTP row
    if valid so the caller can decide when/if to delete it.
    """
    try:
        otp = EmailOTP.objects.select_for_update().get(user=user, purpose=purpose)
    except EmailOTP.DoesNotExist:
        raise ValidationError(
            {"code": "No verification code found. Please request a new code."}
        )

    if otp.is_expired:
        otp.delete()
        raise ValidationError(
            {"code": "This code has expired. Please request a new code."}
        )

    if otp.attempts_remaining <= 0:
        otp.delete()
        raise ValidationError(
            {"code": "Too many incorrect attempts. Please request a new code."}
        )

    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        if otp.attempts >= EmailOTP.MAX_ATTEMPTS:
            otp.delete()
            raise ValidationError(
                {"code": f"Too many incorrect attempts ({EmailOTP.MAX_ATTEMPTS}/{EmailOTP.MAX_ATTEMPTS}). This verification code has been invalidated. Please request a new code."}
            )
        raise ValidationError(
            {"code": f"Incorrect verification code. {otp.attempts_remaining} attempt(s) remaining out of {EmailOTP.MAX_ATTEMPTS}."}
        )
    return otp


@transaction.atomic
def verify_email_otp(user: User, *, code: str) -> OTPVerificationResult:
    """
    Validate the submitted code for email verification. On success: mark email
    verified, activate USER accounts immediately (ORGANIZER accounts stay inactive
    pending admin approval), and delete the OTP row.
    """
    otp = _validate_otp(user, code=code, purpose=EmailOTP.Purpose.EMAIL_VERIFICATION)

    user.is_email_verified = True
    activated = False
    if user.role == User.Role.USER:
        user.is_active = True
        activated = True
    # ORGANIZER: is_active stays False until an admin approves.
    user.save(update_fields=["is_email_verified", "is_active"])
    otp.delete()

    transaction.on_commit(lambda: send_welcome_email(user))
    if user.role == User.Role.ORGANIZER and hasattr(user, "organizer_profile"):
        transaction.on_commit(
            lambda: send_admin_organizer_pending_email(user.organizer_profile)
        )

    return OTPVerificationResult(user=user, activated=activated)


# ==================== PASSWORD RESET ====================


def request_password_reset(*, email: str) -> None:
    """
    Request a password reset OTP. Fails silently if the user doesn't exist
    to prevent email enumeration.
    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return

    # Check cooldown
    try:
        existing = EmailOTP.objects.get(
            user=user, purpose=EmailOTP.Purpose.PASSWORD_RESET
        )
        if existing.seconds_until_resend_allowed > 0:
            return  # Fail silently if they are spamming it
    except EmailOTP.DoesNotExist:
        pass

    otp = issue_otp(user, purpose=EmailOTP.Purpose.PASSWORD_RESET)
    send_password_reset_email(user, otp)


@transaction.atomic
def verify_password_reset_code(*, email: str, code: str) -> None:
    """
    Check if a password reset code is valid without consuming it.
    Useful for the frontend to validate the code before showing the password form.
    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValidationError({"code": "Invalid request."})

    _validate_otp(user, code=code, purpose=EmailOTP.Purpose.PASSWORD_RESET)


@transaction.atomic
def confirm_password_reset(*, email: str, code: str, new_password: str) -> None:
    """
    Validates the code and changes the user's password.
    Also verifies email ownership and activates standard user accounts.
    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValidationError({"code": "Invalid request."})

    otp = _validate_otp(user, code=code, purpose=EmailOTP.Purpose.PASSWORD_RESET)

    user.set_password(new_password)
    user.is_email_verified = True
    if user.role == User.Role.USER:
        user.is_active = True

    user.save(update_fields=["password", "is_email_verified", "is_active"])
    otp.delete()

    send_password_reset_success_email(user)


# ==================== LOGIN GATING ====================


def assert_can_login(user: User) -> None:
    """
    Centralizes requirement #9's three rejection reasons so both the
    custom TokenObtainPairSerializer and any future login path (e.g. social
    auth) enforce identical rules. Raises rather than returning a bool so
    the caller doesn't need its own branching/messages.
    """
    if not user.is_email_verified:
        raise ValidationError({
            "detail": "Please verify your email before logging in.",
            "is_email_verified": False,
            "email": user.email,
        })

    if user.is_organizer and not user.is_approved:
        raise PermissionDenied("Your organizer account is pending admin approval.")

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

    transaction.on_commit(lambda: send_organizer_approved_email(user))
    return profile


@transaction.atomic
def reject_organizer(
    profile: OrganizerProfile, *, admin: User, reason: str
) -> None:
    if not reason.strip():
        raise ValidationError({"reason": "A rejection reason is required."})

    user = profile.user

    if profile.citizenship_document:
        profile.citizenship_document.delete(save=False)
    if profile.pan_document:
        profile.pan_document.delete(save=False)

    transaction.on_commit(lambda: send_organizer_rejected_email(user, reason))
    user.delete()



@transaction.atomic
def change_password(user: User, *, old_password: str, new_password: str) -> None:
    """
    Allows an authenticated user to change their password provided they know their current password.
    """
    if not user.check_password(old_password):
        raise ValidationError({"old_password": "Current password is incorrect."})

    user.set_password(new_password)
    user.save(update_fields=["password"])
