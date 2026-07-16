from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Organizer, OrganizerApprovalRequest


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
    list_display = ('username', 'organization_name', 'email', 'is_approved_by_admin', 'created_at', 'view_approval_status')
    list_filter = ('is_approved_by_admin', 'is_email_verified', 'created_at')
    search_fields = ('username', 'email', 'organization_name')
    ordering = ('-created_at',)
    actions = ['approve_organizer', 'reject_organizer']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Organization', {
            'fields': ('organization_name', 'organization_description')
        }),
        ('Email Verification', {
            'fields': ('is_email_verified', 'email_verification_token')
        }),
        ('Documents', {
            'fields': (
                'citizenship_image',
                'citizenship_pdf',
                'pancard_image',
                'pancard_pdf',
            ),
            'description': 'Upload citizenship and PAN card documents for verification'
        }),
        ('Bank Details', {
            'fields': ('bank_name', 'bank_account_number')
        }),
        ('Admin Approval', {
            'fields': (
                'is_approved_by_admin',
                'approval_request_date',
                'approval_date',
                'rejection_reason',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    readonly_fields = (
        'created_at',
        'updated_at',
        'email_verification_token',
        'approval_request_date',
        'approval_date',
    )
    
    def view_approval_status(self, obj):
        """Display approval status with color coding."""
        if obj.is_approved_by_admin:
            return format_html(
                '<span style="color: green; font-weight: bold;">? Approved</span>'
            )
        elif obj.is_email_verified:
            return format_html(
                '<span style="color: orange; font-weight: bold;">? Pending Review</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">? Awaiting Email Verification</span>'
            )
    view_approval_status.short_description = 'Approval Status'
    
    def approve_organizer(self, request, queryset):
        """Admin action to approve organizers."""
        from django.utils import timezone
        updated = queryset.update(
            is_approved_by_admin=True,
            approval_date=timezone.now()
        )
        self.message_user(request, f"{updated} organizer(s) approved successfully.")
    approve_organizer.short_description = "Approve selected organizers"
    
    def reject_organizer(self, request, queryset):
        """Admin action to reject organizers."""
        updated = queryset.update(is_approved_by_admin=False)
        self.message_user(request, f"{updated} organizer(s) rejected.")
    reject_organizer.short_description = "Reject selected organizers"


@admin.register(OrganizerApprovalRequest)
class OrganizerApprovalRequestAdmin(admin.ModelAdmin):
    """Admin interface for tracking organizer approval requests."""
    list_display = ('organizer', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by_name')
    list_filter = ('status', 'submitted_at', 'reviewed_at')
    search_fields = ('organizer__organization_name', 'organizer__email')
    ordering = ('-submitted_at',)
    actions = ['approve_request', 'reject_request', 'mark_needs_revision']
    readonly_fields = ('submitted_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Request Information', {
            'fields': ('organizer', 'status', 'submitted_at', 'requested_by')
        }),
        ('Admin Review', {
            'fields': ('reviewed_by', 'reviewed_at', 'admin_comments')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def reviewed_by_name(self, obj):
        """Display reviewer name or '-' if not reviewed."""
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else '-'
    reviewed_by_name.short_description = 'Reviewed By'
    
    def approve_request(self, request, queryset):
        """Approve organizer requests."""
        from django.utils import timezone
        
        updated_count = 0
        for approval_request in queryset.filter(status='pending'):
            approval_request.status = 'approved'
            approval_request.reviewed_by = request.user
            approval_request.reviewed_at = timezone.now()
            approval_request.save()
            
            # Update organizer approval status
            approval_request.organizer.is_approved_by_admin = True
            approval_request.organizer.approval_date = timezone.now()
            approval_request.organizer.save()
            
            updated_count += 1
        
        self.message_user(request, f"{updated_count} organizer(s) approved successfully.")
    approve_request.short_description = "Approve selected requests"
    
    def reject_request(self, request, queryset):
        """Reject organizer requests."""
        from django.utils import timezone
        
        updated_count = 0
        for approval_request in queryset.filter(status__in=['pending', 'needs_revision']):
            approval_request.status = 'rejected'
            approval_request.reviewed_by = request.user
            approval_request.reviewed_at = timezone.now()
            approval_request.save()
            
            # Update organizer approval status
            approval_request.organizer.is_approved_by_admin = False
            approval_request.organizer.save()
            
            updated_count += 1
        
        self.message_user(request, f"{updated_count} organizer(s) rejected.")
    reject_request.short_description = "Reject selected requests"
    
    def mark_needs_revision(self, request, queryset):
        """Mark requests as needing revision."""
        updated = queryset.filter(status='pending').update(status='needs_revision')
        self.message_user(request, f"{updated} request(s) marked as needing revision.")
    mark_needs_revision.short_description = "Mark as needs revision"
