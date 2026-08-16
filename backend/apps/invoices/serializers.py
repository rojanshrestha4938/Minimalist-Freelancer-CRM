from decimal import Decimal

from rest_framework import serializers

from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "description",
            "quantity",
            "rate",
            "amount",
        ]
        read_only_fields = ["id", "amount"]

    def get_amount(self, obj):
        return obj.quantity * obj.rate


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    subtotal = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    effective_status = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client",
            "invoice_date",
            "due_date",
            "status",
            "effective_status",
            "tax_rate",
            "notes",
            "items",
            "subtotal",
            "tax_amount",
            "total",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "invoice_number",
            "effective_status",
            "subtotal",
            "tax_amount",
            "total",
            "created_at",
            "updated_at",
        ]

    def get_effective_status(self, obj):
        from django.utils import timezone

        if (
            obj.status == Invoice.Status.SENT
            and obj.due_date < timezone.localdate()
        ):
            return Invoice.Status.OVERDUE

        return obj.status

    def validate_client(self, value):
        request = self.context.get("request")

        if request and value.owner != request.user:
            raise serializers.ValidationError(
                "You do not have permission to create an invoice for this client."
            )

        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one invoice item is required."
            )

        return value

    def validate(self, attrs):
        invoice_date = attrs.get("invoice_date")
        due_date = attrs.get("due_date")

        if invoice_date and due_date and due_date < invoice_date:
            raise serializers.ValidationError(
                {
                    "due_date": "Due date cannot be earlier than invoice date."
                }
            )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        invoice = Invoice.objects.create(
            invoice_number=self.generate_invoice_number(),
            **validated_data,
        )

        InvoiceItem.objects.bulk_create(
            [
                InvoiceItem(
                    invoice=invoice,
                    **item_data,
                )
                for item_data in items_data
            ]
        )

        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if items_data is not None:
            instance.items.all().delete()

            InvoiceItem.objects.bulk_create(
                [
                    InvoiceItem(
                        invoice=instance,
                        **item_data,
                    )
                    for item_data in items_data
                ]
            )

        return instance

    def generate_invoice_number(self):
        last_invoice = (
            Invoice.objects
            .order_by("-id")
            .first()
        )

        year = self.context.get(
            "invoice_year",
            __import__("datetime").date.today().year,
        )

        if not last_invoice:
            number = 1
        else:
            try:
                last_number = int(
                    last_invoice.invoice_number.split("-")[-1]
                )
                number = last_number + 1
            except (ValueError, IndexError):
                number = 1

        return f"INV-{year}-{number:03d}"

    def get_subtotal(self, obj):
        return sum(
            (
                item.quantity * item.rate
                for item in obj.items.all()
            ),
            Decimal("0"),
        )

    def get_tax_amount(self, obj):
        subtotal = self.get_subtotal(obj)

        return subtotal * obj.tax_rate / Decimal("100")

    def get_total(self, obj):
        subtotal = self.get_subtotal(obj)
        tax_amount = subtotal * obj.tax_rate / Decimal("100")

        return subtotal + tax_amount