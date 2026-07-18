"""
Custom validators. Django's built-ins (MinValueValidator, FileExtensionValidator,
URLValidator, etc.) are used directly on fields wherever they suffice — the
functions below only cover checks Django has no built-in for, or that span
more than one field and so can't be expressed as a single field validator.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible


def validate_event_schedule(*, start_datetime, end_datetime, registration_deadline) -> None:
    """
    Cross-field schedule validation shared by the service layer and the
    serializer. Kept as a standalone function (rather than duplicated
    inline in both places) since both `EventSerializer.validate()` and
    `services.create_event`/`update_event` need to enforce the same rule,
    and duplicating it risks the two drifting apart.
    """
    if end_datetime <= start_datetime:
        raise ValidationError(
            {"end_datetime": "End date/time must be after the start date/time."}
        )

    if registration_deadline is not None and registration_deadline > start_datetime:
        raise ValidationError(
            {
                "registration_deadline": (
                    "Registration deadline must be on or before the event's "
                    "start date/time."
                )
            }
        )


def validate_capacity(value: int) -> None:
    if value <= 0:
        raise ValidationError("Capacity must be greater than zero.")


def validate_ticket_quantity(value: int) -> None:
    if value <= 0:
        raise ValidationError("Ticket quantity must be greater than zero.")


def validate_remaining_quantity(*, quantity: int, remaining_quantity: int) -> None:
    if remaining_quantity > quantity:
        raise ValidationError(
            {"remaining_quantity": "Remaining quantity cannot exceed the total quantity."}
        )


# Reusable, deconstructible so migrations can serialize it (required since
# it's attached to model ImageFields, not just used in a serializer) —
# same rationale as OrganizerDocumentValidator in apps.users.validators.
@deconstructible
class EventImageValidator:
    """Restrict event banner/gallery uploads to common image formats, capped size."""

    ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"]
    MAX_SIZE_MB = 10

    def __init__(self):
        self._extension_validator = FileExtensionValidator(
            allowed_extensions=self.ALLOWED_EXTENSIONS
        )

    def __call__(self, value) -> None:
        self._extension_validator(value)
        allowed_types = {
            "image/jpeg",
            "image/jpg",
            "image/pjpeg",
            "image/png",
            "image/x-png",
            "image/webp",
            "image/gif",
            "image/bmp",
            "image/x-ms-bmp",
            "image/tiff",
        }

        content_type = getattr(value, "content_type", None)
        if content_type and content_type != "application/octet-stream" and content_type not in allowed_types:
            raise ValidationError("Unsupported file type.")

        # Fallback: check file name extension
        exts = tuple(f".{ext}" for ext in self.ALLOWED_EXTENSIONS)
        if not value.name.lower().endswith(exts):
            raise ValidationError("Unsupported file type.")

        max_bytes = self.MAX_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise ValidationError(
                f"File too large. Maximum size is {self.MAX_SIZE_MB}MB."
            )

    def __eq__(self, other) -> bool:
        return isinstance(other, EventImageValidator)


validate_event_image = EventImageValidator()