import express from 'express';
import sql from './db.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Sirve tu inventario.html

// Obtener todos los productos
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
