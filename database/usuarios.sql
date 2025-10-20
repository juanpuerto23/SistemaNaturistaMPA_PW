-- =========================================
-- TABLA DE USUARIOS
-- =========================================

-- Crear tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (rol IN ('admin', 'employee')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INT DEFAULT 0
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Crear tabla de auditoría para los intentos de login
CREATE TABLE IF NOT EXISTS auditorias_login (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INT,
    email VARCHAR(120),
    username VARCHAR(50),
    exitoso BOOLEAN,
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Crear índice para auditoría
CREATE INDEX IF NOT EXISTS idx_auditorias_login_fecha ON auditorias_login(fecha_intento);
CREATE INDEX IF NOT EXISTS idx_auditorias_login_usuario ON auditorias_login(id_usuario);

-- Crear función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar fecha_actualizacion
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_usuarios ON usuarios;
CREATE TRIGGER trigger_actualizar_fecha_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Insertar usuario administrador por defecto (contraseña: admin123)
INSERT INTO usuarios (email, username, password_hash, rol)
VALUES (
    'admin@herbalsys.local',
    'admin',
    '$2b$10$YOmxL8SEb7qLlXkXZBsM3u1K1yT1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1',
    'admin'
)
ON CONFLICT (username) DO NOTHING;
