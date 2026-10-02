from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class ProductTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="testpass123", role="admin"
        )
        self.staff = User.objects.create_user(
            username="staff", password="testpass123", role="staff"
        )

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/products/", {
            "name": "Wireless Mouse", "sku": "WM-001", "price": "19.99", "stock_quantity": 50,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["is_low_stock"])

    def test_staff_cannot_create_product(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post("/api/products/", {
            "name": "Wireless Mouse", "sku": "WM-002", "price": "19.99", "stock_quantity": 50,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_product(self):
        response = self.client.post("/api/products/", {
            "name": "Wireless Mouse", "sku": "WM-003", "price": "19.99", "stock_quantity": 50,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_duplicate_sku_rejected(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post("/api/products/", {
            "name": "Keyboard", "sku": "KB-001", "price": "29.99", "stock_quantity": 10,
        }, format="json")
        response = self.client.post("/api/products/", {
            "name": "Another Keyboard", "sku": "KB-001", "price": "39.99", "stock_quantity": 5,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_low_stock_flag_and_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post("/api/products/", {
            "name": "USB Cable", "sku": "USB-001", "price": "5.99",
            "stock_quantity": 3, "low_stock_threshold": 10,
        }, format="json")

        response = self.client.get("/api/products/low_stock/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [p["sku"] for p in response.data["results"]]
        self.assertIn("USB-001", skus)

    def test_deleting_product_with_order_history_fails_gracefully(self):
        self.client.force_authenticate(user=self.admin)
        product = self.client.post("/api/products/", {
            "name": "Cable", "sku": "CBL-001", "price": "3.00", "stock_quantity": 10,
        }, format="json").data

        self.client.post("/api/orders/", {
            "customer_name": "Someone",
            "items": [{"product_id": product["id"], "quantity": 1}],
        }, format="json")

        response = self.client.delete(f"/api/products/{product['id']}/")
        # Should be a clean 400 with a helpful message, not a 500 crash
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
