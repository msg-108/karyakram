from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'email', 'username', 'role', 'is_organizer_approved',
        'is_email_verified', 'is_phone_verified', 'is_active', 'created_at',
    )
    list_filter = ('role', 'is_organizer_approved', 'is_active')
    search_fields = ('email', 'username', 'organization_name', 'phone_number')
    ordering = ('-created_at',)

    fieldsets = UserAdmin.fieldsets + (
        ('Profile', {'fields': ('phone_number', 'date_of_birth', 'is_email_verified', 'is_phone_verified')}),
        ('Organizer Details', {'fields': (
            'organization_name', 'citizenship', 'citizenship_number',
            'pan_number', 'bank_name', 'bank_account_number', 'is_organizer_approved',
        )}),
    )