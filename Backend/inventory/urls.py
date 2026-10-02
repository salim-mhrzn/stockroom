from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, SupplierViewSet, StockMovementViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("stock-movements", StockMovementViewSet, basename="stockmovement")

urlpatterns = router.urls
