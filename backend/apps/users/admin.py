from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Organizer


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for standard users."""
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_email_verified', 'created_at')
    list_filter = ('is_email_verified', 'created_at', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Email Verification', {'fields': ('is_email_verified', 'email_verification_token')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'email_verification_token')


@admin.register(Organizer)
class OrganizerAdmin(BaseUserAdmin):
    """Admin interface for organizers with approval workflow."""
    list_display = ('username', 'organization_name', 'email', 'phone_number', 'is_approved_by_admin', 'created_at')
    list_filter = ('is_approved_by_admin', 'is_email_verified', 'is_phone_verified', 'created_at')
    search_fields = ('username', 'email', 'organization_name', 'phone_number')
    ordering = ('-created_at',)
    actions = ['approve_organizer', 'reject_organizer']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Organization', {
            'fields': ('organization_name', 'organization_description')
        }),
        ('Contact Verification', {
            'fields': ('phone_number', 'is_email_verified', 'is_phone_verified', 'email_verification_token', 'phone_verification_token')
        }),
        ('Documents', {
            'fields': ('citizenship_number', 'pan_number')
        }),
        ('Bank Details', {
            'fields': ('bank_name', 'bank_account_number')
        }),
        ('Admin Approval', {
            'fields': ('is_approved_by_admin',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'email_verification_token', 'phone_verification_token')
    
    def approve_organizer(self, request, queryset):
        """Admin action to approve organizers."""
        updated = queryset.update(is_approved_by_admin=True)
        self.message_user(request, f"{updated} organizer(s) approved successfully.")
    approve_organizer.short_description = "Approve selected organizers"
    
    def reject_organizer(self, request, queryset):
        """Admin action to reject organizers."""
        updated = queryset.update(is_approved_by_admin=False)
        self.message_user(request, f"{updated} organizer(s) rejected.")
    reject_organizer.short_description = "Reject selected organizers"
