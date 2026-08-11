from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import Invoice
from .serializers import InvoiceSerializer
from decimal import Decimal
from .utils import generate_invoice_pdf


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Invoice.objects
            .filter(client__owner=self.request.user)
            .select_related("client")
            .prefetch_related("items")
            .order_by("-created_at")
        )

        status_filter = self.request.query_params.get("status")

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        queryset = self.get_queryset()

        today = timezone.localdate()

        overdue_invoices = queryset.filter(
            Q(status=Invoice.Status.OVERDUE)
            | Q(
                status=Invoice.Status.SENT,
                due_date__lt=today,
            )
        )

        outstanding_invoices = queryset.filter(
            Q(status=Invoice.Status.SENT)
            | Q(
                status=Invoice.Status.OVERDUE
            )
        )

        paid_this_month_invoices = queryset.filter(
            status=Invoice.Status.PAID,
            paid_at__year=today.year,
            paid_at__month=today.month,
        )

        def calculate_total(invoices):
            total = Decimal("0")

            for invoice in invoices.prefetch_related("items"):
                subtotal = sum(
                    (
                        item.quantity * item.rate
                        for item in invoice.items.all()
                    ),
                    Decimal("0"),
                )

                tax = (
                    subtotal
                    * invoice.tax_rate
                    / Decimal("100")
                )

                total += subtotal + tax

            return total

        return Response(
            {
                "overdue": calculate_total(overdue_invoices),
                "outstanding": calculate_total(outstanding_invoices),
                "paid_this_month": calculate_total(
                    paid_this_month_invoices
                ),
            }
        )

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "Invoice is already marked as paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice.status = Invoice.Status.PAID
        invoice.paid_at = timezone.now()

        invoice.save(
            update_fields=["status", "paid_at", "updated_at"]
        )

        serializer = self.get_serializer(invoice)

        return Response(serializer.data)


    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        invoice = self.get_object()

        return generate_invoice_pdf(invoice)