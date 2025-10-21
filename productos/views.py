from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Producto, Categoria, Proveedor
from .serializers import ProductoSerializer, CategoriaSerializer, ProveedorSerializer


@method_decorator(csrf_exempt, name='dispatch')
class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de productos
    """
    queryset = Producto.objects.select_related('id_categoria', 'id_proveedor').all()
    serializer_class = ProductoSerializer


@method_decorator(csrf_exempt, name='dispatch')
class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de categorías
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


@method_decorator(csrf_exempt, name='dispatch')
class ProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de proveedores
    """
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer


# Views adicionales si se necesitan endpoints personalizados
@csrf_exempt
@api_view(['GET'])
def productos_bajo_stock(request):
    """
    Endpoint para obtener productos con stock bajo (menos de 10 unidades)
    """
    productos = Producto.objects.filter(stock_actual__lt=10).select_related('id_categoria', 'id_proveedor')
    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['GET'])
def productos_por_vencer(request):
    """
    Endpoint para obtener productos próximos a vencer (30 días)
    """
    from datetime import date, timedelta
    fecha_limite = date.today() + timedelta(days=30)
    
    productos = Producto.objects.filter(
        fecha_vencimiento__lte=fecha_limite,
        fecha_vencimiento__gte=date.today()
    ).select_related('id_categoria', 'id_proveedor')
    
    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data)
