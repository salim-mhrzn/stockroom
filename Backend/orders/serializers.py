from django.db import transaction
from rest_framework import serializers

from inventory.models import Product, StockMovement, MovementType
from .models import Order, OrderItem, OrderStatus


class OrderItemInputSerializer(serializers.Serializer):
    """Used only for the incoming 'items' list on order creation."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price"]
        read_only_fields = ["unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    """Read serializer -- includes nested items."""
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "customer_name", "customer_email", "status",
            "total_amount", "created_at", "updated_at", "items",
        ]
        read_only_fields = ["status", "total_amount"]


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating an order with nested items.
    Validates stock availability and decrements it atomically in create().
    """
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["id", "customer_name", "customer_email", "items"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")
        return items

    def validate(self, attrs):
        # Aggregate quantities per product first -- if the same product appears
        # in two separate line items, checking each in isolation against current
        # stock would miss that their combined quantity might exceed what's available.
        combined_quantities = {}
        for item in attrs["items"]:
            combined_quantities[item["product_id"]] = (
                combined_quantities.get(item["product_id"], 0) + item["quantity"]
            )

        errors = []
        products_by_id = {}
        for product_id, total_quantity in combined_quantities.items():
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                errors.append(f"Product {product_id} not found.")
                continue

            if product.stock_quantity < total_quantity:
                errors.append(
                    f"Insufficient stock for '{product.name}' "
                    f"(have {product.stock_quantity}, need {total_quantity})."
                )
            products_by_id[product_id] = product

        if errors:
            raise serializers.ValidationError({"items": errors})

        attrs["_products_by_id"] = products_by_id
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        products_by_id = validated_data.pop("_products_by_id")

        order = Order.objects.create(
            customer_name=validated_data["customer_name"],
            customer_email=validated_data.get("customer_email"),
        )

        total = 0
        for item in items_data:
            product = products_by_id[item["product_id"]]

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item["quantity"],
                unit_price=product.price,
            )

            # decrement stock and log the movement for audit purposes
            product.stock_quantity -= item["quantity"]
            product.save(update_fields=["stock_quantity"])

            StockMovement.objects.create(
                product=product,
                movement_type=MovementType.STOCK_OUT,
                quantity=item["quantity"],
                note=f"Order #{order.id}",
            )

            total += product.price * item["quantity"]

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order

    def to_representation(self, instance):
        # After creation, return the full nested representation.
        return OrderSerializer(instance, context=self.context).data


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]

    @transaction.atomic
    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get("status", old_status)

        # If an order is being cancelled (and wasn't already cancelled),
        # the stock that was reserved for it needs to go back -- otherwise
        # the product would stay permanently short by that quantity even
        # though it's still sitting on the shelf, unsold.
        if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
            for item in instance.items.select_related("product"):
                product = item.product
                product.stock_quantity += item.quantity
                product.save(update_fields=["stock_quantity"])

                StockMovement.objects.create(
                    product=product,
                    movement_type=MovementType.STOCK_IN,
                    quantity=item.quantity,
                    note=f"Order #{instance.id} cancelled -- stock restored",
                )

        instance.status = new_status
        instance.save(update_fields=["status"])
        return instance
