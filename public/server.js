import express from 'express';
import sql from './db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Sirve tu inventario.html

// =========================================
// RUTAS DE AUTENTICACIÓN
// =========================================

// Ruta de registro
app.post('/register', async (req, res) => {
  const { email, username, password, role } = req.body;

  try {
    // Validar que los campos no estén vacíos
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El correo no es válido' });
    }

    // Validar username
    if (username.length < 3) {
      return res.status(400).json({ message: 'El usuario debe tener al menos 3 caracteres' });
    }

    // Validar password
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar si el usuario o email ya existen
    const existingUser = await sql`
      SELECT id_usuario FROM usuarios 
      WHERE username = ${username} OR email = ${email}
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'El usuario o correo ya existe' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const result = await sql`
      INSERT INTO usuarios (email, username, password_hash, rol, activo)
      VALUES (${email}, ${username}, ${hashedPassword}, ${role || 'employee'}, true)
      RETURNING id_usuario, username, email, rol
    `;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result[0]
    });

  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta de login
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Validar que los campos no estén vacíos
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario en la base de datos
    const user = await sql`
      SELECT id_usuario, username, email, password_hash, rol, activo
      FROM usuarios 
      WHERE username = ${username} AND rol = ${role}
    `;

    if (user.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const userData = user[0];

    // Verificar si el usuario está activo
    if (!userData.activo) {
      return res.status(403).json({ message: 'Usuario desactivado' });
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);

    if (!passwordMatch) {
      // Incrementar intentos fallidos
      await sql`
        UPDATE usuarios 
        SET intentos_fallidos = intentos_fallidos + 1
        WHERE id_usuario = ${userData.id_usuario}
      `;

      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Actualizar último acceso y resetear intentos fallidos
    await sql`
      UPDATE usuarios 
      SET ultimo_acceso = NOW(), intentos_fallidos = 0
      WHERE id_usuario = ${userData.id_usuario}
    `;

    // Registrar acceso exitoso en auditoría
    await sql`
      INSERT INTO auditorias_login (id_usuario, email, username, exitoso)
      VALUES (${userData.id_usuario}, ${userData.email}, ${userData.username}, true)
    `;

    // Responder con datos de usuario
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      userId: userData.id_usuario,
      username: userData.username,
      email: userData.email,
      role: userData.rol
    });

  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// =========================================
// RUTAS DE PRODUCTOS
// =========================================
app.get('/productos', async (req, res) => {
  try {
    const productos = await sql`SELECT * FROM productos`;
    res.json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// --- RUTA PARA CATEGORÍAS ---
app.get("/categorias", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error obteniendo categorías:", err);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});


// Insertar producto nuevo
app.post('/productos', async (req, res) => {
  const { nombre_producto, descripcion_producto, id_categoria, id_proveedor, stock_actual, precio_venta, fecha_vencimiento } = req.body;
  try {
    await sql`
      INSERT INTO productos (nombre_producto, descripcion_producto, id_categoria, id_proveedor, stock_actual, precio_venta, fecha_vencimiento)
      VALUES (${nombre_producto}, ${descripcion_producto}, ${id_categoria}, ${id_proveedor}, ${stock_actual}, ${precio_venta}, ${fecha_vencimiento})
    `;
    res.json({ success: true, message: 'Producto agregado correctamente' });
  } catch (err) {
    console.error('Error al agregar producto:', err);
    res.status(500).json({ error: 'Error de conexión con el servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
