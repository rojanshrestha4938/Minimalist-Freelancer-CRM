from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models

# pyrefly: ignore [missing-import]
from apps.clients.models import Client


class Project(models.Model):

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("on_hold", "On Hold"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    name = models.CharField(max_length=200)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="in_progress"
    )

    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)]
    )

    due_date = models.DateField()

    def __str__(self):
        return self.name