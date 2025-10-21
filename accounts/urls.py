from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', csrf_exempt(views.registro), name='registro'),
    path('login/', csrf_exempt(views.login_view), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('usuario/', views.usuario_actual, name='usuario_actual'),
]
