from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Usuario(AbstractUser):
    """
    Modelo personalizado de Usuario que extiende el modelo de Django
    """
    rol_choices = [
        ('admin', 'Administrador'),
        ('employee', 'Empleado'),
    ]
    
    rol = models.CharField(max_length=20, choices=rol_choices, default='employee')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    intentos_fallidos = models.IntegerField(default=0)
    
    # Definir related_name para evitar conflictos con auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuario_groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuario_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.'
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"
    
    def registrar_intento_fallido(self):
        """Incrementa el contador de intentos fallidos"""
        self.intentos_fallidos += 1
        self.save()
    
    def limpiar_intentos_fallidos(self):
        """Limpia el contador de intentos fallidos"""
        self.intentos_fallidos = 0
        self.save()


class AuditoriaLogin(models.Model):
    """
    Modelo para registrar los intentos de login
    """
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField()
    username = models.CharField(max_length=150)
    exitoso = models.BooleanField(default=False)
    fecha_intento = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Auditoría Login'
        verbose_name_plural = 'Auditorías Login'
        ordering = ['-fecha_intento']
    
    def __str__(self):
        estado = "Exitoso" if self.exitoso else "Fallido"
        return f"{self.username} - {estado} ({self.fecha_intento})"
