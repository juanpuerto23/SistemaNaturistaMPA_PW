@echo off
REM Script para inicializar Django en Windows

echo ========================================
echo Inicializando Naturista MPA con Django
echo ========================================

echo.
echo PASO 1: Instalando dependencias...
pip install -r requirements.txt

echo.
echo PASO 2: Creando migraciones...
python manage.py makemigrations

echo.
echo PASO 3: Ejecutando migraciones...
python manage.py migrate

echo.
echo ========================================
echo Setup completado!
echo ========================================
echo.
echo Para crear un superusuario, ejecuta:
echo   python manage.py createsuperuser
echo.
echo Para iniciar el servidor, ejecuta:
echo   python manage.py runserver
echo.
echo La aplicación estará disponible en:
echo   http://localhost:8000
echo.
echo Panel de admin en:
echo   http://localhost:8000/admin/
echo ========================================

pause
