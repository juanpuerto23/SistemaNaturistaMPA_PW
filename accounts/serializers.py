from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, AuditoriaLogin


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'rol', 'first_name', 'last_name']
        read_only_fields = ['id']


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    rol = serializers.CharField(required=False, default='employee')
    
    class Meta:
        model = Usuario
        fields = ['email', 'username', 'password', 'password_confirm', 'rol']
    
    def validate(self, data):
        """
        Validar que las contraseñas coincidan y cumplan con los requisitos
        """
        password = data.get('password')
        password_confirm = data.pop('password_confirm', None)
        
        # Validar longitud de contraseña
        if len(password) < 8:
            raise serializers.ValidationError({
                'password': 'La contraseña debe tener al menos 8 caracteres'
            })
        
        # Validar que las contraseñas coincidan
        if password != password_confirm:
            raise serializers.ValidationError({
                'password': 'Las contraseñas no coinciden'
            })
        
        # Validar que el usuario no exista
        if Usuario.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                'username': 'Este nombre de usuario ya existe'
            })
        
        # Validar que el email no exista
        if Usuario.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'Este correo electrónico ya existe'
            })
        
        return data
    
    def create(self, validated_data):
        """
        Crear un nuevo usuario con la contraseña hasheada
        """
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            rol=validated_data.get('rol', 'employee')
        )
        return usuario


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    role = serializers.CharField(required=False)
    
    def validate(self, data):
        """
        Validar credenciales
        """
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            usuario = authenticate(username=username, password=password)
            if not usuario:
                raise serializers.ValidationError(
                    'Usuario o contraseña incorrectos'
                )
            if not usuario.is_active:
                raise serializers.ValidationError(
                    'Esta cuenta está desactivada'
                )
            data['usuario'] = usuario
        else:
            raise serializers.ValidationError(
                'Debe proporcionar usuario y contraseña'
            )
        
        return data


class AuditoriaLoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditoriaLogin
        fields = ['id', 'username', 'email', 'exitoso', 'fecha_intento', 'ip_address']
        read_only_fields = ['id', 'fecha_intento']
