from django.db import migrations, models
from django.utils import timezone


def populate_created_at(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Project.objects.filter(created_at__isnull=True).update(
        created_at=timezone.now()
    )


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_project_created_at_project_updated_at"),
    ]

    operations = [
        migrations.RunPython(
            populate_created_at,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="project",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]