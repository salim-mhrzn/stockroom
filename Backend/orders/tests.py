from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from inventory.models import Product

User = get_user_model()


class OrderTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="testpass123", role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.product = Product.objects.create(
            name="Notebook", sku="NB-001", price="4.50", stock_quantity=20,
        )

    def test_order_decrements_stock(self):
        response = self.client.post("/api/orders/", {
            "customer_name": "Jane Doe",
            "customer_email": "jane@example.com",
            "items": [{"product_id": self.product.id, "quantity": 5}],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_amount"], "22.50")
        self.assertEqual(response.data["status"], "pending")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)

    def test_order_fails_on_insufficient_stock(self):
        response = self.client.post("/api/orders/", {
            "customer_name": "John Doe",
            "items": [{"product_id": self.product.id, "quantity": 100}],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)  # unchanged

    def test_duplicate_product_in_same_order_is_aggregated(self):
        """
        Ordering the same product across two line items must check combined
        quantity against stock, not each line independently (regression test
        for a bug where splitting one product across two lines could oversell).
        """
        # stock is 20; two lines of 15 each would individually "fit" but
        # together (30) exceed stock -- this must be rejected.
        response = self.client.post("/api/orders/", {
            "customer_name": "Jane Doe",
            "items": [
                {"product_id": self.product.id, "quantity": 15},
                {"product_id": self.product.id, "quantity": 15},
            ],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)  # unchanged

    def test_duplicate_product_within_stock_succeeds(self):
        # Two lines of 8 each = 16, which fits within stock of 20.
        response = self.client.post("/api/orders/", {
            "customer_name": "Jane Doe",
            "items": [
                {"product_id": self.product.id, "quantity": 8},
                {"product_id": self.product.id, "quantity": 8},
            ],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 4)

    def test_order_rejects_empty_items(self):
        response = self.client.post("/api/orders/", {
            "customer_name": "No Items", "items": [],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_rejects_nonexistent_product(self):
        response = self.client.post("/api/orders/", {
            "customer_name": "Ghost Product",
            "items": [{"product_id": 99999, "quantity": 1}],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancelling_order_restores_stock(self):
        order_resp = self.client.post("/api/orders/", {
            "customer_name": "Jane Doe",
            "items": [{"product_id": self.product.id, "quantity": 5}],
        }, format="json")
        order_id = order_resp.data["id"]

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)  # 20 - 5

        cancel_resp = self.client.patch(f"/api/orders/{order_id}/", {"status": "cancelled"}, format="json")
        self.assertEqual(cancel_resp.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)  # restored

    def test_cancelling_twice_does_not_double_restore_stock(self):
        order_resp = self.client.post("/api/orders/", {
            "customer_name": "Jane Doe",
            "items": [{"product_id": self.product.id, "quantity": 5}],
        }, format="json")
        order_id = order_resp.data["id"]

        self.client.patch(f"/api/orders/{order_id}/", {"status": "cancelled"}, format="json")
        self.client.patch(f"/api/orders/{order_id}/", {"status": "cancelled"}, format="json")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)  # still 20, not 25

    def test_completed_status_for_walk_in_sale(self):
        order_resp = self.client.post("/api/orders/", {
            "customer_name": "Walk-in Customer",
            "items": [{"product_id": self.product.id, "quantity": 2}],
        }, format="json")
        order_id = order_resp.data["id"]

        response = self.client.patch(f"/api/orders/{order_id}/", {"status": "completed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
