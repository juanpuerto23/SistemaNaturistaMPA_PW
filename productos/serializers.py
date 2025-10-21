from rest_framework import serializers
from .models import Producto, Categoria, Proveedor


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre_categoria', 'descripcion_categoria', 'activo']


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id_proveedor', 
            'nombre_proveedor', 
            'nit_proveedor',
            'telefono_proveedor', 
            'email_proveedor', 
            'direccion_proveedor',
            'contacto_proveedor',
            'activo'
        ]


class ProductoSerializer(serializers.ModelSerializer):
    nombre_categoria = serializers.CharField(source='id_categoria.nombre_categoria', read_only=True)
    nombre_proveedor = serializers.CharField(source='id_proveedor.nombre_proveedor', read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id_producto',
            'nombre_producto',
            'descripcion_producto',
            'precio_compra',
            'precio_venta',
            'stock_actual',
            'fecha_vencimiento',
            'id_categoria',
            'nombre_categoria',
            'id_proveedor',
            'nombre_proveedor'
        ]
    
    def validate_precio_venta(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio de venta no puede ser negativo")
        return value
    
    def validate_stock_actual(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value
