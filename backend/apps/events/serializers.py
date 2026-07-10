from rest_framework import serializers
from .models import Event, EventGalleryImage


class EventGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventGalleryImage
        fields = ['id', 'image', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views -- avoids pulling full
    description/terms/gallery for every event in a listing response."""
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'slug',
            'title',
            'date_time',
            'location',
            'category',
            'banner_image',
            'status',
            'approval_status',
            'organizer_name',
        ]


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for retrieve/create/update. Organizer is read-only here --
    it's set explicitly in the view from request.user, never from client input,
    so a user can never create or reassign an event under someone else's name."""
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    gallery_images = EventGalleryImageSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'slug',
            'organizer',
            'organizer_name',
            'title',
            'description',
            'date_time',
            'location',
            'terms_and_conditions',
            'category',
            'banner_image',
            'capacity',
            'gallery_images',
            'created_at',
            'updated_at',
            'status',
            'approval_status',
        ]
        read_only_fields = [
            'id',
            'slug',
            'organizer',
            'organizer_name',
            'gallery_images',
            'created_at',
            'updated_at',
            # approval_status is NEVER writable by the organizer-facing serializer.
            # Only AdminEventApprovalView (using a separate serializer) can change it.
            'approval_status',
        ]

    def validate_status(self, value):
        # Organizers may only ever submit as draft. Requesting 'published'
        # directly is rejected explicitly rather than silently downgraded --
        # this makes the rule visible in the API response instead of a
        # confusing silent no-op. 'cancelled' is allowed since an organizer
        # cancelling their own event doesn't require approval either way.
        if value == 'published':
            instance = getattr(self, 'instance', None)
            already_approved = instance and instance.approval_status == 'approved'
            if not already_approved:
                raise serializers.ValidationError(
                    "This event cannot be published until it has been approved by an admin."
                )
        return value


class AdminEventApprovalSerializer(serializers.ModelSerializer):
    """Separate, narrow serializer used only by admin-facing approval endpoints.
    Deliberately exposes nothing except approval_status -- an admin approving
    an event should not be able to accidentally rewrite its title/description
    through the same request."""
    class Meta:
        model = Event
        fields = ['id', 'approval_status']
        read_only_fields = ['id']