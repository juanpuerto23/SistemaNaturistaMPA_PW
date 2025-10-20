from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone

from .models import Usuario, AuditoriaLogin
from .serializers import RegistroSerializer, LoginSerializer, UsuarioSerializer


def obtener_ip_cliente(request):
    """Obtener la dirección IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def registro(request):
    """
    Endpoint para registrar un nuevo usuario
    
    POST /api/auth/register/
    {
        "email": "usuario@example.com",
        "username": "usuario123",
        "password": "contraseña123",
        "password_confirm": "contraseña123",
        "rol": "employee"  # opcional, default es "employee"
    }
    """
    serializer = RegistroSerializer(data=request.data)
    
    if serializer.is_valid():
        usuario = serializer.save()
        
        return Response({
            'message': '¡Registro exitoso! Ahora puedes iniciar sesión.',
            'usuario': UsuarioSerializer(usuario).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Endpoint para iniciar sesión
    
    POST /api/auth/login/
    {
        "username": "usuario123",
        "password": "contraseña123",
        "role": "admin"  # opcional
    }
    """
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        usuario = serializer.validated_data['usuario']
        
        # Login del usuario
        login(request, usuario)
        
        # Registrar intento exitoso
        ip_cliente = obtener_ip_cliente(request)
        AuditoriaLogin.objects.create(
            usuario=usuario,
            email=usuario.email,
            username=usuario.username,
            exitoso=True,
            ip_address=ip_cliente,
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Limpiar intentos fallidos
        usuario.limpiar_intentos_fallidos()
        
        # Actualizar último acceso
        usuario.ultimo_acceso = timezone.now()
        usuario.save()
        
        return Response({
            'message': 'Inicio de sesión exitoso',
            'usuario': {
                'userId': usuario.id,
                'username': usuario.username,
                'email': usuario.email,
                'role': usuario.rol
            }
        }, status=status.HTTP_200_OK)
    
    # Registrar intento fallido
    username = request.data.get('username', 'desconocido')
    email = request.data.get('email', 'desconocido@example.com')
    ip_cliente = obtener_ip_cliente(request)
    
    try:
        usuario = Usuario.objects.get(username=username)
        usuario.registrar_intento_fallido()
        email = usuario.email
    except Usuario.DoesNotExist:
        pass
    
    AuditoriaLogin.objects.create(
        email=email,
        username=username,
        exitoso=False,
        ip_address=ip_cliente,
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Endpoint para cerrar sesión
    
    POST /api/auth/logout/
    """
    logout(request)
    
    return Response({
        'message': 'Sesión cerrada exitosamente'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """
    Endpoint para obtener información del usuario actual
    
    GET /api/auth/usuario/
    """
    usuario = request.user
    serializer = UsuarioSerializer(usuario)
    
    return Response(serializer.data, status=status.HTTP_200_OK)
