# Sistema Naturista MPA

Sistema de gestión para Farmacias Naturistas desarrollado con Django y JavaScript, que permite administrar inventario, usuarios y reportes.

## Tecnologías

### Backend
- **Django 4.2.8** - Framework web de Python
- **Django REST Framework 3.14.0** - API REST
- **PostgreSQL** - Base de datos (Supabase)
- **Python 3.12.10**

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript (Vanilla)**

## Características

- Sistema de autenticación (Login/Registro)
- Gestión de usuarios con roles (Admin/Empleado)
- Administración de inventario
- Generación de reportes
- API RESTful

## Instalación

### Requisitos Previos
- Python 3.12+
- PostgreSQL (o cuenta de Supabase)
- Git

### Configuración del Proyecto

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/JuanPabloBallesterosMaciasUis/SistemaNaturistaMPA_PW.git
   cd SistemaNaturistaMPA_PW
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   SECRET_KEY=tu-clave-secreta-django
   DEBUG=True
   DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_bd
   ```

5. **Aplicar migraciones**
   ```bash
   python manage.py migrate
   ```

6. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

7. **Ejecutar servidor de desarrollo**
   ```bash
   python manage.py runserver
   ```

8. **Acceder a la aplicación**
   - Frontend: http://localhost:8000
   - Admin Django: http://localhost:8000/admin
   - API: http://localhost:8000/api/auth/

## Estructura del Proyecto

```
SistemaNaturistaMPA_PW/
├── accounts/              # App de autenticación
│   ├── models.py         # Modelo Usuario personalizado
│   ├── serializers.py    # Serializadores DRF
│   ├── views.py          # Vistas de login/registro
│   └── urls.py           # Rutas de autenticación
├── naturista_mpa/        # Configuración principal
│   ├── settings.py       # Configuración Django
│   ├── urls.py           # URLs principales
│   └── wsgi.py           # Configuración WSGI
├── public/               # Archivos estáticos
│   ├── css/             # Estilos
│   ├── js/              # JavaScript
│   ├── pages/           # Páginas HTML
│   ├── index.html       # Página de login
│   └── menu.html        # Menú principal
├── manage.py            # Utilidad Django
├── requirements.txt     # Dependencias Python
└── README.md           # Este archivo
```

## API Endpoints

### Autenticación

- **POST** `/api/auth/registro/` - Registro de usuarios
  ```json
  {
    "username": "usuario",
    "password": "contraseña",
    "email": "correo@ejemplo.com",
    "rol": "empleado"
  }
  ```

- **POST** `/api/auth/login/` - Inicio de sesión
  ```json
  {
    "username": "usuario",
    "password": "contraseña"
  }
  ```

- **POST** `/api/auth/logout/` - Cerrar sesión

## Roles de Usuario

- **Admin**: Acceso completo al sistema
- **Empleado**: Acceso limitado según permisos

## Base de Datos

El proyecto utiliza PostgreSQL a través de Supabase. El modelo principal es:

- **Usuario**: Modelo personalizado que extiende AbstractUser
  - username
  - email
  - password
  - rol (admin/empleado)
  - date_joined

## Desarrollo

### Crear nuevas migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### Ejecutar pruebas
```bash
python manage.py test
```

### Recolectar archivos estáticos
```bash
python manage.py collectstatic
```

## Notas Importantes

- El proyecto incluye `.gitignore` para evitar subir archivos temporales
- Los archivos `__pycache__/` y `node_modules/` están excluidos del repositorio
- Las credenciales de base de datos deben estar en `.env` (nunca en el código)
- CSRF está deshabilitado para desarrollo (habilitar en producción)

## Autor

Juan Pablo Ballesteros Macías - UIS
Juan Sebastián Puerto Sánchez - UIS

## Licencia

Este proyecto es privado y con fines educativos. 
