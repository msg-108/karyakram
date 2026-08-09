"""
Custom validators. Django's built-ins (EmailValidator, URLValidator,
FileExtensionValidator, password validators configured in settings) are used
directly on fields wherever they suffice — the functions below only cover
formats Django has no built-in for.
"""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible

# Nepal citizenship number: historic & modern DAO formats (hyphen/slash/spaces allowed, e.g. "27-01-75-01234" or "12-34/5678")
_CITIZENSHIP_RE = re.compile(r"^(?:\d{1,4}[-/\s]?){2,4}\d{1,7}$|^\d{5,16}$")

# PAN (Permanent Account Number) issued by Nepal's Inland Revenue Department: 9 digits.
_PAN_RE = re.compile(r"^\d{9}$")

# Nepal Bank Account Number: 8 to 20 digits/alphanumeric characters (NIC Asia, Nabil, Global IME, etc.)
_BANK_ACCOUNT_RE = re.compile(r"^[A-Za-z0-9]{8,20}$")

# Username: letters, numbers, underscore, dot, hyphen; must start with a
# letter; 3-30 chars. Stricter than Django's default AbstractUser regex,
# which also allows leading digits/symbols.
_USERNAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.-]{2,29}$")


def validate_username_format(value: str) -> None:
    if not _USERNAME_RE.match(value):
        raise ValidationError(
            "Username must start with a letter and be 3-30 characters "
            "long, using only letters, numbers, dots, underscores, or "
            "hyphens."
        )


def validate_citizenship_number(value: str) -> None:
    stripped = value.strip()
    if not (5 <= len(stripped) <= 20):
        raise ValidationError(
            "Citizenship number must be between 5 and 20 characters long."
        )
    if not _CITIZENSHIP_RE.match(stripped):
        raise ValidationError(
            "Enter a valid Nepal citizenship number, e.g. '27-01-75-01234' or '12-34/5678'."
        )


def validate_pan_number(value: str) -> None:
    if not _PAN_RE.match(value.strip()):
        raise ValidationError("PAN number must be exactly 9 digits.")


def validate_bank_account_number(value: str) -> None:
    stripped = value.strip()
    if not _BANK_ACCOUNT_RE.match(stripped):
        raise ValidationError(
            "Enter a valid Nepal bank account number (8 to 20 digits/characters)."
        )


def validate_otp_format(value: str) -> None:
    if not re.match(r"^\d{6}$", value):
        raise ValidationError("OTP must be exactly 6 digits.")


# Reusable, deconstructible so migrations can serialize it (required since
# it's attached to a model FileField, not just used in a serializer).
@deconstructible
class OrganizerDocumentValidator:
    """Restrict organizer verification uploads to images/PDF, capped size."""

    ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"]
    MAX_SIZE_MB = 5

    def __init__(self):
        self._extension_validator = FileExtensionValidator(
            allowed_extensions=self.ALLOWED_EXTENSIONS
        )

    def __call__(self, value) -> None:
        # 1. Validate extension (this already works)
        self._extension_validator(value)

        # 2. Validate content_type (but don't trust it blindly)
        allowed_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/jpg",
        }

        content_type = getattr(value, "content_type", None)

        if content_type and content_type not in allowed_types:
            raise ValidationError("Unsupported file type.")

        # 3. Fallback: validate using file name
        if not value.name.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")):
            raise ValidationError("Unsupported file type.")

        # 4. File size check
        max_bytes = self.MAX_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise ValidationError(
                f"File too large. Maximum size is {self.MAX_SIZE_MB}MB."
            )

    def __eq__(self, other) -> bool:
        return isinstance(other, OrganizerDocumentValidator)


validate_organizer_document = OrganizerDocumentValidator()
