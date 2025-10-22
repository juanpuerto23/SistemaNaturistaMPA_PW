"""
URL configuration for naturista_mpa project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('productos.urls')),
    
    # Frontend routes
    path('api/auth/', include('accounts.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='login'),
    path('menu/', TemplateView.as_view(template_name='menu.html'), name='menu'),
    path('pages/inventario.html', TemplateView.as_view(template_name='pages/inventario.html'), name='inventario'),
    path('pages/reportes.html', TemplateView.as_view(template_name='pages/reportes.html'), name='reportes'),
    
    # Servir archivos estáticos en desarrollo
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'public'))
