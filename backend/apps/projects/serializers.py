from rest_framework import serializers

# pyrefly: ignore [missing-import]
from apps.clients.models import Client
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = Project
        fields = [
            "id",
            "client",
            "name",
            "status",
            "progress",
            "due_date",
        ]

    def validate_client(self, client):
        user = self.context["request"].user

        if client.owner != user:
            raise serializers.ValidationError(
                "You cannot create a project for this client."
            )

        return client