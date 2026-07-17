from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Event, EventCategory, EventImage, TicketTier


class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1
    fields = ("image", "image_preview", "caption", "display_order")
    readonly_fields = ("image_preview",)

    def image_preview(self, obj: EventImage):
        if not obj.pk or not obj.image:
            return "—"
        return format_html('<img src="{}" style="max-height: 60px;" />', obj.image.url)

    image_preview.short_description = "Preview"


class TicketTierInline(admin.TabularInline):
    model = TicketTier
    extra = 1
    fields = ("name", "price", "quantity", "remaining_quantity", "display_order", "is_active")
    readonly_fields = ("remaining_quantity",)


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "organizer",
        "category",
        "status",
        "visibility",
        "start_datetime",
        "banner_preview",
        "created_at",
    )

    list_filter = (
        "status",
        "visibility",
        "category",
        "city",
    )

    search_fields = (
        "title",
        "venue",
        "city",
        "organizer__organization_name",
        "organizer__user__username",
    )

    ordering = ("-created_at",)

    prepopulated_fields = {"slug": ("title",)}

    readonly_fields = (
        "approved_by",
        "approved_at",
        "published_at",
        "created_at",
        "updated_at",
        "banner_preview",
    )

    inlines = [TicketTierInline, EventImageInline]

    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "organizer",
                    "category",
                    "title",
                    "slug",
                    "short_description",
                    "description",
                    "terms_and_conditions",
                )
            },
        ),
        (
            "Location",
            {
                "fields": (
                    "venue",
                    "address",
                    "city",
                    "district",
                    "province",
                    "latitude",
                    "longitude",
                )
            },
        ),
        (
            "Media",
            {"fields": ("banner", "banner_preview")},
        ),
        (
            "Schedule & Capacity",
            {
                "fields": (
                    "start_datetime",
                    "end_datetime",
                    "registration_deadline",
                    "capacity",
                )
            },
        ),
        (
            "Status & Review",
            {
                "fields": (
                    "visibility",
                    "status",
                    "approved_by",
                    "approved_at",
                    "rejection_reason",
                    "published_at",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )

    actions = ["bulk_approve", "bulk_reject", "bulk_publish"]

    def banner_preview(self, obj: Event):
        if not obj.banner:
            return "—"
        return format_html('<img src="{}" style="max-height: 60px;" />', obj.banner.url)

    banner_preview.short_description = "Banner"

    @admin.action(description="Approve selected events (submitted only)")
    def bulk_approve(self, request, queryset):
        updated = queryset.filter(status=Event.Status.SUBMITTED).update(
            status=Event.Status.APPROVED,
            approved_by=request.user,
            approved_at=timezone.now(),
            rejection_reason="",
        )
        self.message_user(request, f"{updated} event(s) approved.")

    @admin.action(description="Reject selected events (submitted only)")
    def bulk_reject(self, request, queryset):
        # Bulk actions have no form input to collect a rejection reason,
        # so a generic one is applied here; anything more specific should
        # go through the single-event admin change form or the API's
        # reject action, which both require an explicit reason.
        updated = queryset.filter(status=Event.Status.SUBMITTED).update(
            status=Event.Status.REJECTED,
            approved_by=request.user,
            approved_at=None,
            rejection_reason="Rejected via bulk admin action. Contact the organizer for details.",
        )
        self.message_user(request, f"{updated} event(s) rejected.")

    @admin.action(description="Publish selected events (approved only)")
    def bulk_publish(self, request, queryset):
        updated = queryset.filter(status=Event.Status.APPROVED).update(
            status=Event.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        self.message_user(request, f"{updated} event(s) published.")


@admin.register(TicketTier)
class TicketTierAdmin(admin.ModelAdmin):
    list_display = ("name", "event", "price", "quantity", "remaining_quantity", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "event__title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    list_display = ("event", "caption", "display_order", "image_preview")
    search_fields = ("event__title", "caption")
    readonly_fields = ("created_at", "updated_at", "image_preview")

    def image_preview(self, obj: EventImage):
        if not obj.image:
            return "—"
        return format_html('<img src="{}" style="max-height: 60px;" />', obj.image.url)

    image_preview.short_description = "Preview"