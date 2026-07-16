from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    Standard user model for regular event participants.
    Only requires email verification.
    """
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.email})"

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name='user_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='user_set',
        related_query_name='user',
    )


class Organizer(AbstractUser):
    """
    Organizer model for event creators.
    Requires email verification and admin approval to create events.
    """
    email = models.EmailField(unique=True)
    
    # Verification fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)

    # Approval fields
    is_approved_by_admin = models.BooleanField(default=False)
    approval_request_date = models.DateTimeField(null=True, blank=True)
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Business Information
    organization_name = models.CharField(max_length=255)
    organization_description = models.TextField(blank=True, null=True)
    
    # Document Information (file uploads)
    citizenship_image = models.ImageField(
        upload_to='organizers/documents/citizenship/',
        null=True,
        blank=True,
        help_text="Citizenship certificate image/photo"
    )
    citizenship_pdf = models.FileField(
        upload_to='organizers/documents/citizenship/',
        null=True,
        blank=True,
        help_text="Citizenship certificate PDF"
    )
    pancard_image = models.ImageField(
        upload_to='organizers/documents/pancard/',
        null=True,
        blank=True,
        help_text="PAN card image/photo"
    )
    pancard_pdf = models.FileField(
        upload_to='organizers/documents/pancard/',
        null=True,
        blank=True,
        help_text="PAN card PDF"
    )
    
    # Bank Information
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'organization_name']

    class Meta:
        db_table = 'organizers'
        verbose_name = 'Organizer'
        verbose_name_plural = 'Organizers'

    def __str__(self):
        return f"{self.organization_name} ({self.username})"

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name='organizer_set',
        related_query_name='organizer',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='organizer_set',
        related_query_name='organizer',
    )


class OrganizerApprovalRequest(models.Model):
    """
    Model to track organizer approval requests and responses from admin.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    )

    organizer = models.OneToOneField(
        Organizer,
        on_delete=models.CASCADE,
        related_name='approval_request'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Request information
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    # Admin response
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organizer_approvals_reviewed'
    )
    admin_comments = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizer_approval_requests'
        verbose_name = 'Organizer Approval Request'
        verbose_name_plural = 'Organizer Approval Requests'

    def __str__(self):
        return f"Approval for {self.organizer.organization_name} ({self.status})"
