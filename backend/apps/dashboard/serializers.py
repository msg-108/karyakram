from rest_framework import serializers
from apps.users.models import User, Organizer


class UserDashboardSerializer(serializers.Serializer):
    """Serializer for standard user dashboard."""
    role = serializers.SerializerMethodField()
    id = serializers.IntegerField(source='pk')
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    is_email_verified = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_role(self, obj):
        return 'user'


class OrganizerDashboardSerializer(serializers.Serializer):
    """Serializer for organizer dashboard."""
    role = serializers.SerializerMethodField()
    id = serializers.IntegerField(source='pk')
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    organization_name = serializers.CharField()
    is_email_verified = serializers.BooleanField()
    is_phone_verified = serializers.BooleanField()
    is_approved_by_admin = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_role(self, obj):
        return 'organizer'


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard."""
    role = serializers.SerializerMethodField()
    id = serializers.IntegerField(source='pk')
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_role(self, obj):
        return 'admin'
