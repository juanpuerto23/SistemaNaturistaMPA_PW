from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views
from .views import LogoutAPIView

app_name = 'accounts'

urlpatterns = [
    path('register/', csrf_exempt(views.registro), name='registro'),
    path('login/', csrf_exempt(views.login_view), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('usuario/', views.usuario_actual, name='usuario_actual'),
]
