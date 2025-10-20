from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario, AuditoriaLogin


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'ultimo_acceso', 'intentos_fallidos')}),
    )
    list_display = ['username', 'email', 'rol', 'activo', 'ultimo_acceso']
    list_filter = ['rol', 'activo', 'fecha_creacion']
    search_fields = ['username', 'email']


@admin.register(AuditoriaLogin)
class AuditoriaLoginAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'exitoso', 'fecha_intento', 'ip_address']
    list_filter = ['exitoso', 'fecha_intento']
    search_fields = ['username', 'email', 'ip_address']
    readonly_fields = ['fecha_intento']
