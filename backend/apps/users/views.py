"""
Thin API views. Every view delegates to `services` for anything beyond
request parsing / permission checks / response shaping.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.permissions import IsOrganizer
from . import services
from .models import EmailOTP, OrganizerProfile, User
from .serializers import (
    LogoutSerializer,
    OrganizerApprovalActionSerializer,
    OrganizerProfileSerializer,
    OrganizerProfileUpdateSerializer,
    OrganizerRegisterSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    UserPublicSerializer,
    UserRegisterSerializer,
    UserTokenObtainPairSerializer,
    UserUpdateSerializer,
)

_DETAIL_RESPONSE = inline_serializer(
    name="DetailResponse", fields={"detail": serializers.CharField()}
)


# ==================== REGISTRATION ====================


class UserRegisterView(APIView):
    """Register a standard USER account. Inactive until email is verified."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"

    @extend_schema(
        operation_id="registerUser",
        summary="Register a user account",
        description=(
                "Create a new standard user account. "
                "The account is created inactive and a 6-digit verification OTP "
                "is sent to the registered email address. The user must verify "
                "their email before they can log in."
        ),
        tags=["Authentication"],
        request=UserRegisterSerializer,
        responses={
            201: OpenApiResponse(UserPublicSerializer, description="Account created; OTP sent."),
            400: OpenApiResponse(description="Validation error."),
        },
        examples=[
            OpenApiExample(
                "Request",
                value={
                    "username": "sitagharti",
                    "email": "sita@example.com",
                    "password": "S3cure!Pass",
                    "password_confirm": "S3cure!Pass",
                    "first_name": "Sita",
                    "last_name": "Gharti",
                },
                request_only=True,
            )
        ],
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserPublicSerializer(user).data, status=status.HTTP_201_CREATED)


class OrganizerRegisterView(APIView):
    """Register an ORGANIZER account. Inactive until email is verified AND admin-approved."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"
    # Explicit, since this endpoint accepts file uploads (citizenship/PAN
    # documents) alongside regular form fields — JSONParser alone can't
    # handle multipart bodies.
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        operation_id="registerOrganizer",
        summary="Register an organizer account",
        description=(
                "Create a new organizer account and upload the required "
                "verification documents. After email verification, the account "
                "must be approved by an administrator before login is allowed."
        ),

        tags=["Authentication"],
        request=OrganizerRegisterSerializer,
        responses={
            201: OpenApiResponse(UserPublicSerializer, description="Account created; OTP sent."),
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def post(self, request):
        serializer = OrganizerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializer.to_representation(user), status=status.HTTP_201_CREATED)


# ==================== EMAIL VERIFICATION (OTP) ====================


class VerifyEmailOTPView(APIView):
    """Verify the 6-digit OTP sent at registration. USER accounts activate
    immediately; ORGANIZER accounts remain inactive pending admin approval."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"

    @extend_schema(
        operation_id="verifyEmailOTP",
        summary="Verify email address",
        description=(
                "Verify the 6-digit OTP sent to the user's email address. "
                "Regular users become active immediately after verification. "
                "Organizer accounts remain pending until approved by an administrator."
        ),
        tags=["Email Verification"],
        request=OTPVerifySerializer,
        responses={
            200: OpenApiResponse(_DETAIL_RESPONSE, description="Email verified."),
            400: OpenApiResponse(description="Invalid/expired code, or too many attempts."),
        },
    )
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(User, email=serializer.validated_data["email"])

        result = services.verify_email_otp(
            user,
            code=serializer.validated_data["code"],
        )

        detail = (
            "Email verified. You can now log in."
            if result.activated
            else "Email verified. Your account is now awaiting admin approval."
        )
        return Response({"detail": detail}, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    """Resend a 6-digit verification code. Subject to configured cooldown."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"

    @extend_schema(
        operation_id="resendVerificationOTP",
        summary="Resend verification OTP",
        description=(
                "Generate and send a new email verification OTP. "
                "Requests are subject to the configured resend cooldown period."
        ),
        tags=["Email Verification"],
        request=OTPRequestSerializer,
        responses={
            200: OpenApiResponse(_DETAIL_RESPONSE, description="A new code was sent."),
            400: OpenApiResponse(description="Cooldown still active, or no account found."),
        },
    )
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(User, email=serializer.validated_data["email"])
        purpose = serializer.validated_data.get("purpose", EmailOTP.Purpose.EMAIL_VERIFICATION)

        services.resend_otp(user, purpose=purpose)
        return Response({"detail": "A new verification code has been sent."})


# ==================== LOGIN ====================


class LoginView(TokenObtainPairView):
    """
    Username + password login. Rejects (per requirement #9) when the
    email is unverified, the account is inactive, or an organizer is
    still pending admin approval — enforced in
    UserTokenObtainPairSerializer.validate() via services.assert_can_login.
    """

    permission_classes = [AllowAny]
    serializer_class = UserTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"

    @extend_schema(
        operation_id="login",
        summary="Authenticate user",
        description=(
                "Authenticate using username and password. "
                "Returns JWT access and refresh tokens. "
                "Login is denied if the email is unverified, "
                "the account is inactive, or the organizer "
                "is still awaiting administrator approval."
        ),
        tags=["Authentication"],
        responses={
            200: OpenApiResponse(description="Returns `access` and `refresh` JWTs."),
            400: OpenApiResponse(description="Invalid credentials, unverified email, or inactive account."),
            403: OpenApiResponse(description="Organizer account pending admin approval."),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CustomTokenRefreshView(TokenRefreshView):
    """Refresh JWT access token using a valid refresh token."""

    permission_classes = [AllowAny]



# ==================== PROFILE ====================


class MeView(RetrieveUpdateAPIView):
    """Return or update the authenticated user's own profile."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserUpdateSerializer
        return UserPublicSerializer

    def get_object(self) -> User:
        return self.request.user

    @extend_schema(
        operation_id="getCurrentUser",
        summary="Get current user profile",
        description="Return the authenticated user's profile information.",
        tags=["Profile"],
        responses=UserPublicSerializer,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        operation_id="updateCurrentUser",
        summary="Update current user profile",
        description="Update current user's name or username. Email and role are read-only.",
        tags=["Profile"],
        request=UserUpdateSerializer,
        responses=UserPublicSerializer,
    )
    def patch(self, request, *args, **kwargs):
        response = super().patch(request, *args, **kwargs)
        # Ensure representation returns full UserPublicSerializer response format
        user = self.get_object()
        return Response(UserPublicSerializer(user).data)

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)


class MyOrganizerProfileView(RetrieveUpdateAPIView):
    """Return or update the authenticated organizer's OrganizerProfile."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return OrganizerProfileUpdateSerializer
        return OrganizerProfileSerializer

    def get_object(self) -> OrganizerProfile:
        return get_object_or_404(OrganizerProfile, user=self.request.user)

    @extend_schema(
        operation_id="getOrganizerProfile",
        summary="Get organizer profile",
        description="Return the authenticated organizer's profile information.",
        tags=["Profile"],
        responses=OrganizerProfileSerializer,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        operation_id="updateOrganizerProfile",
        summary="Update organizer profile",
        description="Update organizer organization info. Legal & financial details are read-only.",
        tags=["Profile"],
        request=OrganizerProfileUpdateSerializer,
        responses=OrganizerProfileSerializer,
    )
    def patch(self, request, *args, **kwargs):
        response = super().patch(request, *args, **kwargs)
        profile = self.get_object()
        return Response(OrganizerProfileSerializer(profile).data)

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)


# ==================== ADMIN: ORGANIZER APPROVAL ====================


class PendingOrganizerListView(APIView):
    """List organizers awaiting approval (email verified, not yet approved). Admin only."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="listPendingOrganizers",
        summary="List pending organizers",
        description=(
                "Return all organizer accounts that have verified "
                "their email but are still waiting for administrator approval."
        ),
        tags=["Admin: Organizers"],
        responses=OrganizerProfileSerializer(many=True),
    )
    def get(self, request):
        pending = OrganizerProfile.objects.filter(
            user__role=User.Role.ORGANIZER,
            user__is_email_verified=True,
            user__is_approved=False,
            approved_by__isnull=True,
            rejection_reason="",
        ).select_related("user")
        return Response(OrganizerProfileSerializer(pending, many=True).data)


class OrganizerApprovalView(APIView):
    """Approve or reject a specific organizer's application. Admin only."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="approveOrRejectOrganizer",
        summary="Approve or reject organizer",
        description=(
            "Approve or reject an organizer registration request. "
            "Approving activates the account. Rejecting sends a rejection email "
            "and removes the account data from the database."
        ),
        tags=["Admin: Organizers"],
        request=OrganizerApprovalActionSerializer,
        responses={
            200: OpenApiResponse(
                description="Organizer approved (returns profile) or rejected (account deleted)."
            ),
            400: OpenApiResponse(
                description="Invalid approval request."
            ),
            404: OpenApiResponse(
                description="Organizer not found."
            ),
        },
    )

    def post(self, request, user_id: int):
        profile = get_object_or_404(OrganizerProfile, user_id=user_id)
        serializer = OrganizerApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["action"] == "approve":
            profile = services.approve_organizer(profile, admin=request.user)
            return Response(OrganizerProfileSerializer(profile).data)
        else:
            services.reject_organizer(
                profile, admin=request.user, reason=serializer.validated_data["reason"]
            )
            return Response(
                {"detail": "Organizer registration rejected and account deleted."},
                status=status.HTTP_200_OK,
            )


# ==================== PASSWORD RESET & LOGOUT ====================


class PasswordResetRequestView(APIView):
    """Request a password reset code to be sent via email."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_burst"

    @extend_schema(
        operation_id="requestPasswordReset",
        summary="Request password reset",
        description="Send a password reset OTP to the given email address.",
        tags=["Authentication"],
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiResponse(description="If the email exists and is active, an OTP is sent.")},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.request_password_reset(email=serializer.validated_data["email"])
        return Response({"detail": "If the email is registered, a password reset code has been sent."})


class PasswordResetVerifyView(APIView):
    """Verify a password reset code without consuming it."""

    permission_classes = []

    @extend_schema(
        operation_id="verifyPasswordResetCode",
        summary="Verify password reset code",
        description="Verify that a password reset OTP is valid.",
        tags=["Authentication"],
        request=PasswordResetVerifySerializer,
        responses={
            200: OpenApiResponse(description="Code is valid."),
            400: OpenApiResponse(description="Code is invalid or expired."),
        },
    )
    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.verify_password_reset_code(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        return Response({"detail": "Code is valid."})


class PasswordResetConfirmView(APIView):
    """Submit a new password along with a valid reset code."""

    permission_classes = []

    @extend_schema(
        operation_id="confirmPasswordReset",
        summary="Confirm password reset",
        description="Change the password using a valid reset OTP.",
        tags=["Authentication"],
        request=PasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(description="Password changed successfully."),
            400: OpenApiResponse(description="Code is invalid or expired."),
        },
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.confirm_password_reset(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response({"detail": "Password has been successfully changed."})


class LogoutView(APIView):
    """Log out by blacklisting the refresh token."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="logout",
        summary="Log out",
        description="Blacklist the provided refresh token.",
        tags=["Authentication"],
        request=LogoutSerializer,
        responses={
            200: OpenApiResponse(description="Logged out successfully."),
            400: OpenApiResponse(description="Invalid token."),
        },
    )
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError

        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh_token"])
            token.blacklist()
        except TokenError:
            raise ValidationError({"refresh_token": "Token is invalid or expired."})
        return Response({"detail": "Successfully logged out."})


class PasswordChangeView(APIView):
    """Change password for an authenticated user using their current password."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="changePassword",
        summary="Change password",
        description="Change password for the authenticated user using their current password.",
        tags=["Profile"],
        request=PasswordChangeSerializer,
        responses={
            200: OpenApiResponse(_DETAIL_RESPONSE, description="Password updated successfully."),
            400: OpenApiResponse(description="Validation error or incorrect current password."),
        },
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response({"detail": "Password has been updated successfully."})