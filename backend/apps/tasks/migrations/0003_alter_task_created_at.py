from django.db import migrations, models
from django.utils import timezone


def populate_created_at(apps, schema_editor):
    Task = apps.get_model("tasks", "Task")
    Task.objects.filter(created_at__isnull=True).update(
        created_at=timezone.now()
    )


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0002_task_created_at_task_updated_at"),
    ]

    operations = [
        migrations.RunPython(
            populate_created_at,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="task",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]