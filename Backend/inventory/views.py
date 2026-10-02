from django.db.models import F
from django.db.models import ProtectedError
from django_filters import rest_framework as filters
from rest_framework import viewsets, decorators, response
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsAdminOrReadOnly
from .models import Product, Supplier, StockMovement
from .serializers import ProductSerializer, SupplierSerializer, StockMovementSerializer


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category", lookup_expr="iexact")
    low_stock_only = filters.BooleanFilter(method="filter_low_stock")

    class Meta:
        model = Product
        fields = ["category"]

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__lte=F("low_stock_threshold"))
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for products.
    GET is open to any authenticated user; write actions require admin role.
    """
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "category"]

    @decorators.action(detail=False, methods=["get"])
    def low_stock(self, request):
        """GET /api/products/low_stock/ -- list products at or below threshold."""
        qs = self.get_queryset().filter(stock_quantity__lte=F("low_stock_threshold"))
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return response.Response(serializer.data)

    def perform_destroy(self, instance):
        # OrderItem.product uses on_delete=PROTECT, so deleting a product with
        # order history raises ProtectedError. Without this, that becomes an
        # unhandled 500 -- turn it into a clear, actionable 400 instead.
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                "This product can't be deleted because it appears in existing orders. "
                "Consider removing it from future use instead (e.g. set stock to 0)."
            )


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("id")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrReadOnly]


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only audit log -- movements are created by order/product logic, not directly."""
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["product", "movement_type"]
