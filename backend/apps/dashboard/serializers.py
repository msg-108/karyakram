from rest_framework import serializers
from apps.users.serializers import UserProfileSerializer
from django.contrib.auth import get_user_model

class UserDashboardSerializer(serializers.Serializer):
    profile = UserProfileSerializer()

    # Add user specific stats later

    def to_representation(self, user):
        return {
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

            # "total_bookings": user.bookings.count(),
        }
    }

class OrganizerDashboardSerializer(serializers.Serializer):
    profile = UserProfileSerializer()

    # Add organizer specific stats later

    def to_representation(self, user):
        return {
            "profile": UserProfileSerializer(user).data,
            # "total_events": user.events.count(),

        }


class AdminDashboardSerializer(serializers.Serializer):
    profile = UserProfileSerializer()

    # Add admin specific stats later

    def to_representation(self, user):

        # User = get_user_model()
        return {
            "profile": UserProfileSerializer(user).data,
            # "total_users": User.objects.filter(role="user").count(),
        }