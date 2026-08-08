"""
Input/output validation only — no business logic. Registration serializers
validate and hand a plain dict to `services.register_user` /
`services.register_organizer`, which do the actual creation.
"""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator

from . import services
from .models import OrganizerProfile, User
from .validators import (
    validate_otp_format,
    validate_username_format,
    validate_citizenship_number,
    validate_pan_number,
    validate_bank_account_number,
)

# ==================== SHARED ====================


class UserPublicSerializer(serializers.ModelSerializer):
    """Read-only representation used in nested/response contexts."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_email_verified",
            "is_approved",
            "created_at",
        ]
        read_only_fields = fields


# ==================== REGISTRATION ====================


class UserRegisterSerializer(serializers.ModelSerializer):
    """Registration for role=USER. Account is created inactive; see services.register_user."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords don't match."}
            )
        return attrs

    def create(self, validated_data: dict) -> User:
        return services.register_user(validated_data=validated_data)


class OrganizerRegisterSerializer(serializers.Serializer):
    """
    Registration for role=ORGANIZER. Not a ModelSerializer because it spans
    two models (User + OrganizerProfile) — kept explicit here rather than
    forcing a single Meta.model to paper over that.
    """

    # --- User fields ---
    username = serializers.CharField(
        max_length=150,
        validators=[
            UniqueValidator(queryset=User.objects.all()),
            validate_username_format,
        ],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    # --- OrganizerProfile fields ---
    organization_name = serializers.CharField(max_length=255)
    organization_description = serializers.CharField(required=False, allow_blank=True)
    website_url = serializers.URLField(required=False, allow_blank=True)

    citizenship_number = serializers.CharField(
        max_length=150,
        validators=[
            validate_citizenship_number,
        ],
    )
    pan_number = serializers.CharField(
        write_only=True,
        validators=[
            validate_pan_number,
        ],
    )

    bank_name = serializers.CharField(max_length=255)
    bank_account_number = serializers.CharField(
        write_only=True,
        validators=[
            validate_bank_account_number,
        ],
    )
    citizenship_document = serializers.FileField()
    pan_document = serializers.FileField()

    _USER_FIELDS = ("username", "email", "password", "first_name", "last_name")

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords don't match."}
            )
        return attrs

    def create(self, validated_data: dict) -> User:
        user_data = {k: validated_data.pop(k) for k in self._USER_FIELDS}
        # Whatever remains in validated_data belongs to OrganizerProfile.
        return services.register_organizer(
            validated_data=user_data, profile_data=validated_data
        )

    def to_representation(self, instance: User) -> dict:
        return UserPublicSerializer(instance).data


# ==================== OTP ====================


class OTPRequestSerializer(serializers.Serializer):
    """Used by the resend-OTP endpoint. Email identifies the account since
    the user isn't authenticated yet at this point in the flow."""

    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(validators=[validate_otp_format])

    def validate_email(self, value: str) -> str:
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


# ==================== LOGIN ====================


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds role/verification claims to the JWT and enforces requirement #9's
    login gating (unverified email / inactive / pending organizer
    approval) before SimpleJWT's default validate() issues any token.
    """

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)
        token["role"] = user.role
        token["is_email_verified"] = user.is_email_verified
        token["is_approved"] = user.is_approved
        token["is_staff"] = user.is_staff
        return token

    def validate(self, attrs: dict) -> dict:
        # Temporarily bypass SimpleJWT's own is_active check so we can
        # surface our own, more specific error messages first (e.g.
        # "pending approval" instead of a generic "no active account").
        val = attrs.get(self.username_field)
        user = User.objects.filter(username=val).first()
        if user is None and "@" in str(val):
            user = User.objects.filter(email__iexact=val).first()
        if user is not None:
            services.assert_can_login(user)
        return super().validate(attrs)


# ==================== ORGANIZER PROFILE / APPROVAL ====================


class OrganizerProfileSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = OrganizerProfile
        fields = [
            "id",
            "user",
            "organization_name",
            "organization_description",
            "website_url",
            "bank_name",
            "citizenship_document",
            "pan_document",
            "approval_requested_at",
            "approved_at",
            "rejection_reason",
        ]
        read_only_fields = fields


class OrganizerApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["action"] == "reject" and not attrs.get("reason", "").strip():
            raise serializers.ValidationError(
                {"reason": "A reason is required when rejecting an organizer."}
            )
        return attrs


# ==================== PASSWORD RESET & LOGOUT ====================


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()
