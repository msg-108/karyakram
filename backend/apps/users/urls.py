from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    MyOrganizerProfileView,
    OrganizerApprovalView,
    OrganizerRegisterView,
    PendingOrganizerListView,
    ResendOTPView,
    UserRegisterView,
    VerifyEmailOTPView,
    PasswordResetRequestView,
    PasswordResetVerifyView,
    PasswordResetConfirmView,
    LogoutView,
)

app_name = "users"

urlpatterns = [
    # Registration
    path("auth/register/user/", UserRegisterView.as_view(), name="register-user"),
    path("auth/register/organizer/", OrganizerRegisterView.as_view(), name="register-organizer"),
    # Email verification (OTP)
    path("auth/verify-otp/", VerifyEmailOTPView.as_view(), name="verify-otp"),
    path("auth/resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    # Login & Logout
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Password Reset
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("auth/password-reset/verify/", PasswordResetVerifyView.as_view(), name="password-reset-verify"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    # Profile
    path("me/", MeView.as_view(), name="me"),
    path("me/organizer-profile/", MyOrganizerProfileView.as_view(), name="my-organizer-profile"),
    # Admin: organizer approval
    path(
        "admin/organizers/pending/",
        PendingOrganizerListView.as_view(),
        name="pending-organizers",
    ),
    path(
        "admin/organizers/<int:user_id>/approval/",
        OrganizerApprovalView.as_view(),
        name="organizer-approval",
    ),
]