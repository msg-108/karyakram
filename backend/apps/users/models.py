from django.contrib.auth.models import AbstractUser
from django.db import models


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

    # Override groups and permissions related_name
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
    Requires both email and phone number verification.
    """
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=14, unique=True)
    
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    is_approved_by_admin = models.BooleanField(default=False)
    
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    phone_verification_token = models.CharField(max_length=255, blank=True, null=True)

    # Business Information
    organization_name = models.CharField(max_length=255)
    organization_description = models.TextField(blank=True, null=True)
    
    # Document Information
    citizenship_number = models.CharField(max_length=14, blank=True, null=True)
    pan_number = models.CharField(max_length=9, blank=True, null=True)
    
    # Bank Information
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'phone_number', 'organization_name']

    class Meta:
        db_table = 'organizers'
        verbose_name = 'Organizer'
        verbose_name_plural = 'Organizers'

    def __str__(self):
        return f"{self.organization_name} ({self.username})"

    # Override groups and permissions related_name
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
