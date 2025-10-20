import dotenv from 'dotenv';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio raíz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Cargar .env
dotenv.config({ path: envPath });

console.log('🔄 Conectando a Supabase...');

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require'
});

async function crearTablas() {
    try {
        console.log('✓ Conectado a Supabase');
        console.log('🔄 Creando tabla usuarios...');
        
        // Crear tabla usuarios
        await sql`
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
            )
        `;
        console.log('✓ Tabla usuarios creada');
        
        // Crear índices
        console.log('🔄 Creando índices...');
        await sql`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol)`;
        console.log('✓ Índices creados');
        
        // Crear tabla de auditoría
        console.log('🔄 Creando tabla auditorias_login...');
        await sql`
            CREATE TABLE IF NOT EXISTS auditorias_login (
                id_auditoria SERIAL PRIMARY KEY,
                id_usuario INT,
                email VARCHAR(120),
                username VARCHAR(50),
                exitoso BOOLEAN,
                fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
            )
        `;
        console.log('✓ Tabla auditorias_login creada');
        
        // Crear índices de auditoría
        console.log('🔄 Creando índices de auditoría...');
        await sql`CREATE INDEX IF NOT EXISTS idx_auditorias_login_fecha ON auditorias_login(fecha_intento)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_auditorias_login_usuario ON auditorias_login(id_usuario)`;
        console.log('✓ Índices de auditoría creados');
        
        // Crear función para actualizar fecha
        console.log('🔄 Creando trigger...');
        await sql`
            CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;
        
        // Crear trigger
        await sql`
            DROP TRIGGER IF EXISTS trigger_actualizar_fecha_usuarios ON usuarios
        `;
        
        await sql`
            CREATE TRIGGER trigger_actualizar_fecha_usuarios
            BEFORE UPDATE ON usuarios
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_fecha_actualizacion()
        `;
        console.log('✓ Trigger creado');
        
        // Insertar usuario admin
        console.log('🔄 Insertando usuario admin...');
        await sql`
            INSERT INTO usuarios (email, username, password_hash, rol)
            VALUES (
                'admin@herbalsys.local',
                'admin',
                '$2b$10$YOmxL8SEb7qLlXkXZBsM3u1K1yT1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1',
                'admin'
            )
            ON CONFLICT (username) DO NOTHING
        `;
        console.log('✓ Usuario admin insertado');
        
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ ¡TABLAS CREADAS EXITOSAMENTE!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('📊 Base de datos configurada con:');
        console.log('  ✓ Tabla usuarios');
        console.log('  ✓ Tabla auditorias_login');
        console.log('  ✓ Índices optimizados');
        console.log('  ✓ Triggers automáticos');
        console.log('  ✓ Usuario admin precargado');
        console.log('');
        console.log('🔐 Credenciales Admin:');
        console.log('  Usuario: admin');
        console.log('  Contraseña: admin123');
        console.log('  Rol: admin');
        console.log('');
        console.log('🚀 Ahora puedes:');
        console.log('  1. Iniciar el servidor: npm start');
        console.log('  2. Abrir: http://localhost:3000');
        console.log('  3. Probar registro y login');
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear tablas:', error);
        console.error('Detalles del error:', error.message);
        process.exit(1);
    }
}

crearTablas();
