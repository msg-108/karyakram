from rest_framework import serializers
from apps.users.serializers import UserProfileSerializer
from django.contrib.auth import get_user_model

class UserDashboardSerializer(serializers.Serializer):
    role = serializers.CharField(default="user")
    profile = UserProfileSerializer()

    def to_representation(self, user):
        return {
            "role": "user",
            "profile": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "date_of_birth": user.date_of_birth,
                "role": user.role,
                "is_email_verified": user.is_email_verified,
                "is_phone_verified": user.is_phone_verified,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            },
        }


class OrganizerDashboardSerializer(serializers.Serializer):
    role = serializers.CharField(default="organizer")
    profile = UserProfileSerializer()

    def to_representation(self, user):
        return {
            "role": "organizer",
            "profile": UserProfileSerializer(user).data,
        }


class AdminDashboardSerializer(serializers.Serializer):
    role = serializers.CharField(default="admin")
    profile = UserProfileSerializer()

    def to_representation(self, user):
        return {
            "role": "admin",
            "profile": UserProfileSerializer(user).data,
        }