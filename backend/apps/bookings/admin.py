from django.contrib import admin

from .models import Booking, BookingItem


class BookingItemInline(admin.TabularInline):
    model = BookingItem
    extra = 0
    fields = ("ticket_tier", "quantity", "price_at_purchase")
    readonly_fields = ("price_at_purchase",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "event", "status", "total_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email", "event__title")
    ordering = ("-created_at",)
    readonly_fields = ("total_amount", "created_at", "updated_at")
    inlines = [BookingItemInline]


@admin.register(BookingItem)
class BookingItemAdmin(admin.ModelAdmin):
    list_display = ("booking", "ticket_tier", "quantity", "price_at_purchase")
    search_fields = ("booking__id", "ticket_tier__name")
    readonly_fields = ("created_at",)