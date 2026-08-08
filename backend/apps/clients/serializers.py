from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "email",
            "company",
            "avatar",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
    
    def validate_email(self, value):
        if not value or "@" not in value:
            raise serializers.ValidationError("Please enter a valid email address.")
        return value
    
    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Client name is required.")
        return value