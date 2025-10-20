from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.registro, name='registro'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('usuario/', views.usuario_actual, name='usuario_actual'),
]
