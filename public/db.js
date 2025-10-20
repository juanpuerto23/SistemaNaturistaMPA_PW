import dotenv from 'dotenv';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio raíz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: envPath });

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require'
});
console.log("URL de conexión cargada:", process.env.DATABASE_URL ? "✓ Conectado a Supabase" : "✗ No cargada");
export default sql;