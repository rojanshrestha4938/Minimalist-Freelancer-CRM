from django.contrib import admin
from django.contrib import admin

from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "company",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "name",
        "email",
        "company",
    )

    ordering = (
        "-created_at",
    )