from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('organizer', 'Organizer'),
    )

    CITIZENSHIP_CHOICES = (
        ('NP', 'Nepali'),
    )

    # Basic Fields
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=14, blank=True, unique=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Organizer Specific Fields
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    citizenship = models.CharField(max_length=2, choices=CITIZENSHIP_CHOICES, blank=True, null=True)
    citizenship_number = models.CharField(max_length=14, blank=True, null=True, unique=True)
    pan_number = models.CharField(max_length=9, blank=True, null=True, unique=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=20, blank=True, null=True)
    is_organizer_approved = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username