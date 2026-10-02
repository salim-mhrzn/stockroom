from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from inventory.models import Supplier, Product

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with demo suppliers and products for testing/demo purposes."

    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin", email="admin@example.com", password="admin12345", role="admin"
            )
            self.stdout.write(self.style.SUCCESS("Created superuser 'admin' / 'admin12345'"))

        supplier, _ = Supplier.objects.get_or_create(
            name="Acme Supplies", defaults={"contact_email": "sales@acme.example.com"}
        )

        demo_products = [
            {"name": "Wireless Mouse", "sku": "WM-001", "category": "Electronics", "price": 19.99, "stock_quantity": 50},
            {"name": "Mechanical Keyboard", "sku": "KB-001", "category": "Electronics", "price": 79.99, "stock_quantity": 8},
            {"name": "USB-C Cable", "sku": "USB-001", "category": "Accessories", "price": 5.99, "stock_quantity": 200},
            {"name": "Notebook", "sku": "NB-001", "category": "Stationery", "price": 4.50, "stock_quantity": 3},
            {"name": "Desk Lamp", "sku": "DL-001", "category": "Office", "price": 24.99, "stock_quantity": 15},
        ]

        for data in demo_products:
            Product.objects.get_or_create(sku=data["sku"], defaults={**data, "supplier": supplier})

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(demo_products)} demo products."))
