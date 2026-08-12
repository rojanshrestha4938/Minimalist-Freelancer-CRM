from decimal import Decimal

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# pyrefly: ignore [missing-import]
from apps.invoices.models import Invoice
# pyrefly: ignore [missing-import]
from apps.projects.models import Project
# pyrefly: ignore [missing-import]
from apps.tasks.models import Task


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        # ---------------------------------------------
        # 1. Total Revenue
        # ---------------------------------------------
        paid_invoices = Invoice.objects.filter(
            client__owner=user,
            status=Invoice.Status.PAID,
        )

        revenue = Decimal("0")

        for invoice in paid_invoices.prefetch_related("items"):
            subtotal = sum(
                (
                    item.quantity * item.rate
                    for item in invoice.items.all()
                ),
                Decimal("0"),
            )

            tax_amount = (
                subtotal * invoice.tax_rate / Decimal("100")
            )

            revenue += subtotal + tax_amount

        # ---------------------------------------------
        # 2. Active Projects
        # ---------------------------------------------
        active_projects = Project.objects.filter(
            owner=user,
            status="in_progress",
        ).count()

        # ---------------------------------------------
        # 3. Pending Invoices
        # ---------------------------------------------
        pending_invoices = Invoice.objects.filter(
            client__owner=user,
        ).exclude(
            status__in=[
                Invoice.Status.DRAFT,
                Invoice.Status.PAID,
            ]
        ).count()

        # ---------------------------------------------
        # 4. Tasks Due Today
        # ---------------------------------------------
        tasks_due_today = Task.objects.filter(
            owner=user,
            due_date=today,
        ).exclude(
            status="completed"
        ).count()

        # ---------------------------------------------
        # 5. Recent Activity
        # ---------------------------------------------
        activities = []

        # Paid invoices
        recent_paid_invoices = (
            Invoice.objects
            .filter(
                client__owner=user,
                status=Invoice.Status.PAID,
                paid_at__isnull=False,
            )
            .select_related("client")
            .order_by("-paid_at")[:10]
        )

        for invoice in recent_paid_invoices:
            subtotal = sum(
                (
                    item.quantity * item.rate
                    for item in invoice.items.all()
                ),
                Decimal("0"),
            )

            tax_amount = (
                subtotal * invoice.tax_rate / Decimal("100")
            )

            total = subtotal + tax_amount

            activities.append({
                "type": "invoice_paid",
                "message": (
                    f"{invoice.client.name} paid invoice "
                    f"{invoice.invoice_number}"
                ),
                "timestamp": invoice.paid_at,
                "amount": total,
            })

        # Updated projects
        recent_projects = (
            Project.objects
            .filter(
                owner=user,
                updated_at__isnull=False,
            )
            .select_related("client")
            .order_by("-updated_at")[:10]
        )

        for project in recent_projects:
            activities.append({
                "type": "project_updated",
                "message": (
                    f"{project.name} project updated to "
                    f"{project.get_status_display()}"
                ),
                "timestamp": project.updated_at,
            })

        # Created tasks
        recent_tasks = (
            Task.objects
            .filter(
                owner=user,
                created_at__isnull=False,
            )
            .select_related("project")
            .order_by("-created_at")[:10]
        )

        for task in recent_tasks:
            activities.append({
                "type": "task_created",
                "message": (
                    f"New task '{task.name}' added to "
                    f"{task.project.name}"
                ),
                "timestamp": task.created_at,
            })

        # Combine all activities and get latest 3
        activities.sort(
            key=lambda activity: activity["timestamp"],
            reverse=True,
        )

        recent_activity = activities[:3]

        # ---------------------------------------------
        # 6. Upcoming Deadlines
        # ---------------------------------------------
        upcoming_projects = (
            Project.objects
            .filter(
                owner=user,
                due_date__gte=today,
            )
            .exclude(
                status="completed"
            )
            .select_related("client")
            .order_by("due_date")[:4]
        )

        upcoming_deadlines = []

        for project in upcoming_projects:
            upcoming_deadlines.append({
                "id": project.id,
                "name": project.name,
                "due_date": project.due_date,
                "client": {
                    "id": project.client.id,
                    "name": project.client.name,
                },
                "status": project.status,
            })

        return Response({
            "stats": {
                "total_revenue": revenue,
                "active_projects": active_projects,
                "pending_invoices": pending_invoices,
                "tasks_due_today": tasks_due_today,
            },
            "recent_activity": recent_activity,
            "upcoming_deadlines": upcoming_deadlines,
        })