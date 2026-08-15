from decimal import Decimal

from rest_framework import serializers

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    active_projects = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "email",
            "company",
            "avatar",
            "status",
            "active_projects",
            "total_revenue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "active_projects",
            "total_revenue",
            "created_at",
            "updated_at",
        ]

    def validate_email(self, value):
        if not value or "@" not in value:
            raise serializers.ValidationError(
                "Please enter a valid email address."
            )
        return value

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError(
                "Client name is required."
            )
        return value

    def get_active_projects(self, obj):
        return obj.projects.filter(
            status="in_progress"
        ).count()

    def get_total_revenue(self, obj):
        total_revenue = Decimal("0")

        paid_invoices = obj.invoices.filter(
            status="paid"
        ).prefetch_related("items")

        for invoice in paid_invoices:
            subtotal = sum(
                (
                    item.quantity * item.rate
                    for item in invoice.items.all()
                ),
                Decimal("0"),
            )

            tax_amount = (
                subtotal
                * invoice.tax_rate
                / Decimal("100")
            )

            total_revenue += subtotal + tax_amount

        return total_revenue