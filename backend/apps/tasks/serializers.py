from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "name",
            "description",
            "status",
            "due_date",
        ]

    def validate_project(self, project):
        user = self.context["request"].user

        if project.owner != user:
            raise serializers.ValidationError(
                "You cannot create a task for this project."
            )

        return project