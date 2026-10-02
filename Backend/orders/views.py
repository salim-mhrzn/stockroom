from rest_framework import viewsets, permissions

from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    Any authenticated user can create/view orders.
    Only PATCH-ing status is separated out via a dedicated action.
    """
    queryset = Order.objects.all().prefetch_related("items", "items__product").order_by("-id")
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]  # no full update/delete

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "partial_update":
            return OrderStatusUpdateSerializer
        return OrderSerializer
