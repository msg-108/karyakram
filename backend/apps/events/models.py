from django.db import models
from django.utils.text import slugify
from apps.users.models import Organizer


class Event(models.Model):
    """
    Event model for event management.
    Only Organizers can create events.
    """
    EVENT_STATUS = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
    )

    EVENT_APPROVAL_STATUS = (
        ('approved', 'Approved'),
        ('pending', 'Pending'),
        ('rejected', 'Rejected'),
    )

    CATEGORY_CHOICES = (
        ('comedy', 'Comedy'),
        ('music', 'Music'),
        ('sports', 'Sports'),
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
        ('theatre', 'Theatre'),
        ('festival', 'Festival'),
        ('other', 'Other'),
    )

    # Ownership - Only Organizer can own events
    organizer = models.ForeignKey(
        Organizer,
        on_delete=models.PROTECT,
        related_name='events'
    )

    # Basic Fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    date_time = models.DateTimeField()
    location = models.CharField(max_length=200)
    terms_and_conditions = models.TextField(blank=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    banner_image = models.ImageField(upload_to='events/banners/')
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Optional venue-wide cap, independent of per-ticket-type quantities'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Status
    status = models.CharField(max_length=20, choices=EVENT_STATUS, default='draft')
    approval_status = models.CharField(max_length=20, choices=EVENT_APPROVAL_STATUS, default='pending')

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'events'
        ordering = ['-date_time']

    def __str__(self):
        return self.title


class EventGalleryImage(models.Model):
    """Multiple gallery images per event. banner_image on Event stays the single cover image."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='events/gallery/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_gallery_images'

    def __str__(self):
        return f"Gallery image for {self.event.title}"
