from django.contrib import admin
from .models import Producto, Categoria, Proveedor


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['id_categoria', 'nombre_categoria', 'activo']
    search_fields = ['nombre_categoria']
    list_filter = ['activo']


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['id_proveedor', 'nombre_proveedor', 'telefono_proveedor', 'email_proveedor', 'activo']
    search_fields = ['nombre_proveedor', 'email_proveedor', 'nit_proveedor']
    list_filter = ['activo']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['id_producto', 'nombre_producto', 'stock_actual', 'precio_venta', 'fecha_vencimiento']
    list_filter = ['id_categoria', 'id_proveedor']
    search_fields = ['id_producto', 'nombre_producto']
    date_hierarchy = 'fecha_vencimiento'
