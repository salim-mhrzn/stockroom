from django.db import models

from inventory.models import Product


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"  # instant walk-in sale, paid and done
    SHIPPED = "shipped", "Shipped"          # delivery-style order, left the shop
    DELIVERED = "delivered", "Delivered"    # delivery-style order, reached customer
    CANCELLED = "cancelled", "Cancelled"


class Order(models.Model):
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of order

    def __str__(self):
        return f"{self.quantity} x {self.product.sku}"
