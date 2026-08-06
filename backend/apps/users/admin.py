from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, OrganizerProfile, EmailOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_email_verified",
        "is_approved",
        "is_active",
        "is_staff",
        "created_at",
    )

    list_filter = (
        "role",
        "is_email_verified",
        "is_approved",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
    )

    ordering = ("-created_at",)

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Account",
            {
                "fields": (
                    "role",
                    "is_email_verified",
                    "is_approved",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "organization_name",
        "user",
        "bank_name",
        "approval_requested_at",
        "approved_at",
        "approved_by",
    )

    search_fields = (
        "organization_name",
        "user__username",
        "user__email",
    )

    list_filter = (
        "approved_at",
        "approval_requested_at",
    )

    readonly_fields = (
        "approval_requested_at",
        "created_at",
        "updated_at",
    )


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "purpose",
        "created_at",
        "last_sent_at",
        "attempts",
    )

    list_filter = (
        "purpose",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "code",
        "created_at",
        "last_sent_at",
    )
