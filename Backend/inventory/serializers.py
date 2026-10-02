from rest_framework import serializers

from .models import Product, Supplier, StockMovement


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_email", "contact_phone", "address", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "sku", "description", "category", "price",
            "stock_quantity", "low_stock_threshold", "supplier",
            "is_low_stock", "created_at", "updated_at",
        ]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ["id", "product", "movement_type", "quantity", "note", "created_at"]
        read_only_fields = ["created_at"]
