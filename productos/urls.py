from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, 
    CategoriaViewSet, 
    ProveedorViewSet,
    productos_bajo_stock,
    productos_por_vencer
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')

urlpatterns = [
    path('', include(router.urls)),
    path('productos/bajo-stock/', productos_bajo_stock, name='productos-bajo-stock'),
    path('productos/por-vencer/', productos_por_vencer, name='productos-por-vencer'),
]
