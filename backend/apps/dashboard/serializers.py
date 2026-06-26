from rest_framework import serializers
from apps.users.serializers import UserProfileSerializer
from django.contrib.auth import get_user_model

class UserDashboardSerializer(serializers.Serializer):
    profile = UserProfileSerializer()

    # Add user specific stats later

    def to_representation(self, user):
        return {
            "profile": UserProfileSerializer(user).data,
            # "total_bookings": user.bookings.count(),
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