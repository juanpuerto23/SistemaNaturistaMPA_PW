from django.db import models

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100)
    descripcion_categoria = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        managed = False
    
    def __str__(self):
        return self.nombre_categoria


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre_proveedor = models.CharField(max_length=200)
    nit_proveedor = models.CharField(max_length=50, blank=True, null=True)
    telefono_proveedor = models.CharField(max_length=20, blank=True, null=True)
    email_proveedor = models.EmailField(blank=True, null=True)
    direccion_proveedor = models.TextField(blank=True, null=True)
    contacto_proveedor = models.CharField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'proveedores'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        managed = False
    
    def __str__(self):
        return self.nombre_proveedor


class Producto(models.Model):
    id_producto = models.CharField(max_length=50, primary_key=True)
    nombre_producto = models.CharField(max_length=200)
    descripcion_producto = models.TextField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.IntegerField(default=0)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    id_categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        db_column='id_categoria',
        related_name='productos'
    )
    id_proveedor = models.ForeignKey(
        Proveedor, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        db_column='id_proveedor',
        related_name='productos'
    )
    
    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre_producto']
        managed = False
    
    def __str__(self):
        return f"{self.id_producto} - {self.nombre_producto}"
