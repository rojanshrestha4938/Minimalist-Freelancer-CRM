from django.db.models import Q

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Client
from .serializers import ClientSerializer
from .pagination import ClientPagination


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ClientPagination

    def get_queryset(self):
        queryset = Client.objects.filter(
            owner=self.request.user
        )

        search = self.request.query_params.get("search")
        status = self.request.query_params.get("status")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(company__icontains=search)
            )

        if status:
            queryset = queryset.filter(
                status=status
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user
        )