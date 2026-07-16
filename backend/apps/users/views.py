from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, inline_serializer
from .models import User, Organizer, OrganizerApprovalRequest
from .serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    OrganizerRegisterSerializer,
    OrganizerProfileSerializer,
    OrganizerApprovalRequestSerializer,
)


# ==================== USER VIEWS ====================

class UserRegisterView(APIView):
    """API endpoint for user registration."""
    permission_classes = [AllowAny]

    @extend_schema(
        request=UserRegisterSerializer,
        responses=UserProfileSerializer,
        description="Register a new standard user account",
        tags=["User Authentication"],
    )
    def post(self, request):
        """Register a new user."""
        serializer = UserRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


class UserProfileView(APIView):
    """API endpoint for user profile management."""
    permission_classes = [IsAuthenticated]

    def get_user_or_404(self, request):
        if isinstance(request.user, User) and not isinstance(request.user, Organizer):
            return request.user
        return None

    @extend_schema(
        responses=UserProfileSerializer,
        description="Get the authenticated user's profile",
        tags=["User Profile"],
    )
    def get(self, request):
        """Get user profile."""
        user = self.get_user_or_404(request)
        if not user:
            return Response(
                {"detail": "Only standard users can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    @extend_schema(
        request=UserProfileSerializer,
        responses=UserProfileSerializer,
        description="Update the authenticated user's profile",
        tags=["User Profile"],
    )
    def patch(self, request):
        """Update user profile."""
        user = self.get_user_or_404(request)
        if not user:
            return Response(
                {"detail": "Only standard users can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


# ==================== ORGANIZER VIEWS ====================

class OrganizerRegisterView(APIView):
    """API endpoint for organizer registration."""
    permission_classes = [AllowAny]

    @extend_schema(
        request=OrganizerRegisterSerializer,
        responses=OrganizerProfileSerializer,
        description="Register a new organizer account (requires email verification and admin approval)",
        tags=["Organizer Authentication"],
    )
    def post(self, request):
        """Register a new organizer."""
        serializer = OrganizerRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        organizer = serializer.save()
        return Response(OrganizerProfileSerializer(organizer).data, status=status.HTTP_201_CREATED)


class OrganizerProfileView(APIView):
    """API endpoint for organizer profile management."""
    permission_classes = [IsAuthenticated]

    def get_organizer_or_404(self, request):
        if isinstance(request.user, Organizer):
            return request.user
        return None

    @extend_schema(
        responses=OrganizerProfileSerializer,
        description="Get the authenticated organizer's profile",
        tags=["Organizer Profile"],
    )
    def get(self, request):
        """Get organizer profile."""
        organizer = self.get_organizer_or_404(request)
        if not organizer:
            return Response(
                {"detail": "Only organizers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = OrganizerProfileSerializer(organizer)
        return Response(serializer.data)

    @extend_schema(
        request=OrganizerProfileSerializer,
        responses=OrganizerProfileSerializer,
        description="Update the authenticated organizer's profile",
        tags=["Organizer Profile"],
    )
    def patch(self, request):
        """Update organizer profile."""
        organizer = self.get_organizer_or_404(request)
        if not organizer:
            return Response(
                {"detail": "Only organizers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = OrganizerProfileSerializer(organizer, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class OrganizerApprovalStatusView(APIView):
    """API endpoint to check organizer approval status."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=OrganizerApprovalRequestSerializer,
        description="Get organizer's approval request status",
        tags=["Organizer Profile"],
    )
    def get(self, request):
        """Get approval status."""
        organizer = self.get_organizer_or_404(request)
        if not organizer:
            return Response(
                {"detail": "Only organizers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            approval_request = organizer.approval_request
            serializer = OrganizerApprovalRequestSerializer(approval_request)
            return Response(serializer.data)
        except OrganizerApprovalRequest.DoesNotExist:
            return Response(
                {"detail": "No approval request found."},
                status=status.HTTP_404_NOT_FOUND
            )

    def get_organizer_or_404(self, request):
        if isinstance(request.user, Organizer):
            return request.user
        return None


# ==================== LOGOUT VIEW ====================

class LogoutView(APIView):
    """API endpoint for user logout (works for both User and Organizer)."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer(name="LogoutRequest", fields={"refresh": serializers.CharField()}),
        responses=inline_serializer(name="LogoutResponse", fields={"detail": serializers.CharField()}),
        description="Logout the authenticated user",
        tags=["Authentication"],
    )
    def post(self, request):
        """Logout user by blacklisting their refresh token."""
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== EMAIL VERIFICATION VIEWS ====================

class SendEmailVerificationView(APIView):
    """API endpoint to send email verification link."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name="EmailVerificationResponse",
            fields={"detail": serializers.CharField()}
        ),
        description="Send email verification link to the user",
        tags=["Email Verification"],
    )
    def post(self, request):
        """Send email verification link."""
        user = request.user
        
        # Check if email already verified
        if user.is_email_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate verification token
        from .email_utils import generate_email_token
        token = generate_email_token()
        user.email_verification_token = token
        user.save()
        
        # Send email (console backend prints it)
        from django.core.mail import send_mail
        frontend_url = "http://localhost:5173"  # TODO: Make configurable
        verification_link = f"{frontend_url}/verify-email?email={user.email}&token={token}"
        
        send_mail(
            subject="Email Verification for Karyakram",
            message=f"Click the link to verify your email:\n\n{verification_link}\n\nToken: {token}",
            from_email="noreply@karyakram.com",
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return Response(
            {"detail": "Verification email sent. Check your email for the link."},
            status=status.HTTP_200_OK
        )


class VerifyEmailTokenView(APIView):
    """API endpoint to verify email token."""
    permission_classes = [AllowAny]

    @extend_schema(
        request=inline_serializer(
            name="VerifyEmailRequest",
            fields={
                "email": serializers.EmailField(),
                "token": serializers.CharField(),
            }
        ),
        responses=inline_serializer(
            name="VerifyEmailResponse",
            fields={"detail": serializers.CharField(), "is_verified": serializers.BooleanField()}
        ),
        description="Verify email using token",
        tags=["Email Verification"],
    )
    def post(self, request):
        """Verify email token."""
        email = request.data.get("email")
        token = request.data.get("token")
        
        if not email or not token:
            return Response(
                {"detail": "Email and token are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user or organizer with this email
        user = User.objects.filter(email=email).first()
        if user:
            if user.email_verification_token == token:
                user.is_email_verified = True
                user.email_verification_token = ""
                user.save()
                return Response(
                    {"detail": "Email verified successfully.", "is_verified": True},
                    status=status.HTTP_200_OK
                )
        
        organizer = Organizer.objects.filter(email=email).first()
        if organizer:
            if organizer.email_verification_token == token:
                organizer.is_email_verified = True
                organizer.email_verification_token = ""
                organizer.save()
                return Response(
                    {"detail": "Email verified successfully.", "is_verified": True},
                    status=status.HTTP_200_OK
                )
        
        return Response(
            {"detail": "Invalid email or token.", "is_verified": False},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== ORGANIZER APPROVAL VIEWS ====================

class OrganizerApprovalReplyView(APIView):
    """API endpoint for admin to approve/reject organizer applications."""
    permission_classes = [IsAuthenticated]

    def check_admin_permission(self, request):
        """Check if user is admin/staff."""
        return request.user.is_staff

    @extend_schema(
        request=inline_serializer(
            name="ApprovalReplyRequest",
            fields={
                "approval_id": serializers.IntegerField(),
                "status": serializers.ChoiceField(choices=["approved", "rejected", "needs_revision"]),
                "admin_comments": serializers.CharField(required=False, allow_blank=True),
            }
        ),
        responses=inline_serializer(
            name="ApprovalReplyResponse",
            fields={"detail": serializers.CharField(), "status": serializers.CharField()}
        ),
        description="Admin endpoint to approve/reject organizer application",
        tags=["Organizer Approval"],
    )
    def post(self, request):
        """Process organizer approval/rejection."""
        if not self.check_admin_permission(request):
            return Response(
                {"detail": "Only admin can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval_id = request.data.get("approval_id")
        new_status = request.data.get("status")
        admin_comments = request.data.get("admin_comments", "")
        
        if not approval_id or not new_status:
            return Response(
                {"detail": "approval_id and status are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in ["approved", "rejected", "needs_revision"]:
            return Response(
                {"detail": "Invalid status. Choose from: approved, rejected, needs_revision."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            approval_request = OrganizerApprovalRequest.objects.get(id=approval_id)
        except OrganizerApprovalRequest.DoesNotExist:
            return Response(
                {"detail": "Approval request not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update approval status
        approval_request.status = new_status
        approval_request.reviewed_by = request.user
        approval_request.reviewed_at = __import__('django.utils.timezone', fromlist=['now']).now()
        approval_request.admin_comments = admin_comments
        approval_request.save()
        
        # Update organizer approval status if approved
        if new_status == "approved":
            organizer = approval_request.organizer
            organizer.is_approved_by_admin = True
            organizer.approval_date = __import__('django.utils.timezone', fromlist=['now']).now()
            organizer.save()
        elif new_status == "rejected":
            organizer = approval_request.organizer
            organizer.is_approved_by_admin = False
            organizer.rejection_reason = admin_comments
            organizer.save()
        
        return Response(
            {"detail": f"Organizer application {new_status.lower()}.", "status": new_status},
            status=status.HTTP_200_OK
        )


class OrganizerApprovalListView(APIView):
    """API endpoint to list pending organizer approvals (admin only)."""
    permission_classes = [IsAuthenticated]

    def check_admin_permission(self, request):
        """Check if user is admin/staff."""
        return request.user.is_staff

    @extend_schema(
        responses=inline_serializer(
            name="ApprovalListResponse",
            fields={
                "pending": serializers.ListField(child=serializers.DictField()),
                "approved": serializers.ListField(child=serializers.DictField()),
                "rejected": serializers.ListField(child=serializers.DictField()),
            }
        ),
        description="List organizer approval requests (admin only)",
        tags=["Organizer Approval"],
    )
    def get(self, request):
        """Get list of approval requests."""
        if not self.check_admin_permission(request):
            return Response(
                {"detail": "Only admin can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from .serializers import OrganizerApprovalStatusSerializer
        
        pending = OrganizerApprovalRequest.objects.filter(status="pending")
        approved = OrganizerApprovalRequest.objects.filter(status="approved")
        rejected = OrganizerApprovalRequest.objects.filter(status="rejected")
        
        return Response({
            "pending": OrganizerApprovalStatusSerializer(pending, many=True).data,
            "approved": OrganizerApprovalStatusSerializer(approved, many=True).data,
            "rejected": OrganizerApprovalStatusSerializer(rejected, many=True).data,
        })
