from rest_framework import serializers
from .models import Event, EventGalleryImage


class EventGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventGalleryImage
        fields = ['id', 'image', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class EventListSerializer(serializers.ModelSerializer):
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
        if value == 'published':
            instance = getattr(self, 'instance', None)
            already_approved = instance and instance.approval_status == 'approved'
            if not already_approved:
                raise serializers.ValidationError(
                    "This event cannot be published until it has been approved by an admin."
                )
        return value


class AdminEventApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'approval_status']
        read_only_fields = ['id']