import sql from './db.js'

async function obtenerProductos() {
    try {
        const productos = await sql`SELECT * FROM public.productos`
        console.log(productos)
    } catch (error) {
        console.error('Error al obtener productos:', error)
    }
}

obtenerProductos()