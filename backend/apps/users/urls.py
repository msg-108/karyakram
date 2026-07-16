from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    UserRegisterView,
    UserProfileView,
    OrganizerRegisterView,
    OrganizerProfileView,
    OrganizerApprovalStatusView,
    LogoutView,
)

app_name = 'users'

urlpatterns = [
    # User endpoints
    path('auth/user/register/', UserRegisterView.as_view(), name='user-register'),
    path('auth/user/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # Organizer endpoints
    path('auth/organizer/register/', OrganizerRegisterView.as_view(), name='organizer-register'),
    path('auth/organizer/profile/', OrganizerProfileView.as_view(), name='organizer-profile'),
    path('auth/organizer/approval-status/', OrganizerApprovalStatusView.as_view(), name='organizer-approval-status'),
    
    # JWT endpoints (work for both User and Organizer)
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]
