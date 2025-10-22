// =========================================
// VERIFICACIÓN DE AUTENTICACIÓN EN MENÚ
// =========================================

// Función para obtener CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Verificar si el usuario está autenticado
window.addEventListener('DOMContentLoaded', function() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }

    // Actualizar la información del usuario en el menú
    if (userRole) {
        const roleElements = document.querySelectorAll('.text-muted small strong');
        if (roleElements.length > 0) {
            roleElements.forEach(el => {
                el.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
            });
        }
    }
});

// =========================================
// FUNCIONES PARA LOGOUT
// =========================================

// Agregar evento al botón de logout cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        // usar la implementación centralizada performLogout
        logoutBtn.addEventListener('click', performLogout);
    }
});

// --- AÑADIDO / MODIFICADO: logout robusto y resumen de inventario ---
/**
 * Intento de logout (prueba /api/auth/logout/ y fallback /api/logout/)
 */
async function performLogout() {
  const csrftoken = getCookie('csrftoken');
  const endpoints = ['/api/auth/logout/', '/api/logout/'];

  // token fallback names que podrías usar en tu app
  const possibleToken = localStorage.getItem('authToken') || localStorage.getItem('token') || null;
  const authHeaders = possibleToken ? {
    'Authorization': (possibleToken.startsWith('Bearer ') || possibleToken.startsWith('Token ')) ? possibleToken : `Token ${possibleToken}`
  } : {};

  for (const ep of endpoints) {
    try {
      // intentar logout usando cookies/sesión (incluye CSRF)
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
          ...authHeaders
        },
        // importante: enviar cookies de sesión al servidor
        credentials: 'include'
      });

      if (res.ok) {
        // limpiar almacenamiento local y redirigir al login
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
      }

      // si responde 401/403, intentar limpiar local y redirigir (posible sesión expirada)
      if (res.status === 401 || res.status === 403) {
        console.warn('Logout endpoint respondió', res.status);
        // Si tenemos token, intentar invalidar con Authorization (segundo intento)
        if (possibleToken && !authHeaders.Authorization) {
          try {
            const res2 = await fetch(ep, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${possibleToken}`
              },
              credentials: 'include'
            });
            if (res2.ok) {
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('userId');
              localStorage.removeItem('username');
              localStorage.removeItem('userRole');
              localStorage.removeItem('authToken');
              localStorage.removeItem('token');
              window.location.href = '/';
              return;
            }
          } catch (e) {
            console.warn('Fallback con Authorization falló', e);
          }
        }

        // si no se pudo, igual limpiar local y redirigir para evitar estado inconsistente
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
      }

      // si otro código de error, intentar siguiente endpoint
      const txt = await res.text().catch(()=> '');
      console.warn('Logout fallo:', ep, res.status, txt);
    } catch (e) {
      console.warn('Error intentando logout en', ep, e);
      // probar siguiente endpoint
    }
  }

  alert('No se pudo cerrar sesión. Revisa la conexión o el servidor.');
}

// Reemplaza/asegura el handler del botón logout
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    // quitar listener previo si existe (no hace falta que encadene)
    try { logoutBtn.removeEventListener('click', performLogout); } catch (e) { /* ignore */ }
    logoutBtn.addEventListener('click', performLogout);
  }
});

// Utilidad fetchJson (si no existe ya; si ya existe, la duplicación no romperá si función está definida)
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status} - ${txt}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const txt = await res.text().catch(()=> '');
    throw new Error('Respuesta no JSON: ' + (txt.slice(0,200)));
  }
  return await res.json();
}

/**
 * Carga resumen del inventario y actualiza UI:
 * - inventoryValue: suma(stock_actual * precio_venta)
 * - lowStockCount: cantidad de productos con stock <= lowThreshold
 * - activeClients: (reutilizado) productos agregados hoy
 * - alertsList: lista de productos con stock bajo (nombre - stock)
 *
 * Maneja respuestas paginadas (DRF): si la respuesta tiene .results usa esa lista.
 */
async function loadInventorySummary(lowThreshold = 2) {
  try {
    const data = await fetchJson('/api/productos/');
    const productos = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
    let totalValue = 0;
    const lowItems = [];
    const todayISO = new Date().toISOString().slice(0,10);
    let addedToday = 0;

    const dateFields = ['created_at','fecha_creacion','fecha_registro','fecha_agregado','created','fecha'];

    productos.forEach(p => {
      const stock = Number(p.stock_actual ?? p.stock ?? 0);
      const precio = Number(p.precio_venta ?? p.precio ?? 0);
      totalValue += (stock * (isNaN(precio) ? 0 : precio));

      if (!isNaN(stock) && stock <= lowThreshold) {
        lowItems.push({ nombre: p.nombre_producto ?? p.producto_nombre ?? p.nombre ?? 'Sin nombre', stock, id: p.id_producto ?? p.id });
      }

      // comprobar posible fecha de creación
      let prodDate = null;
      for (const f of dateFields) {
        if (p[f]) {
          // Normalizar strings tipo "2025-10-21T..." y fechas simples "2025-10-21"
          try {
            prodDate = new Date(p[f]);
            if (!isNaN(prodDate.getTime())) break;
            prodDate = null;
          } catch (e) {
            prodDate = null;
          }
        }
      }
      if (prodDate) {
        if (prodDate.toISOString().slice(0,10) === todayISO) addedToday++;
      }
    });

    // Actualizar UI (elementos existentes en menu.html)
    const invEl = document.getElementById('inventoryValue');
    const lowEl = document.getElementById('lowStockCount');
    const todayEl = document.getElementById('activeClients');
    const alertsList = document.getElementById('alertsList');

    if (invEl) invEl.textContent = `$${totalValue.toFixed(2)}`;
    if (lowEl) lowEl.textContent = String(lowItems.length);
    if (todayEl) todayEl.textContent = String(addedToday);

    if (alertsList) {
      alertsList.innerHTML = '';
      if (lowItems.length === 0) {
        alertsList.insertAdjacentHTML('beforeend', '<li class="list-group-item">No hay alertas</li>');
      } else {
        lowItems.slice(0,10).forEach(it => {
          alertsList.insertAdjacentHTML('beforeend', `<li class="list-group-item d-flex justify-content-between align-items-center">
            <div><strong>${escapeHtml(it.nombre)}</strong></div>
            <span class="badge bg-danger rounded-pill">Stock: ${it.stock}</span>
          </li>`);
        });
        if (lowItems.length > 10) {
          alertsList.insertAdjacentHTML('beforeend', `<li class="list-group-item text-muted">+${lowItems.length-10} más</li>`);
        }
      }
    }

  } catch (err) {
    console.error('loadInventorySummary', err);
  }
}

// pequeño helper para evitar inyección en la inserción HTML
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Llamar loadInventorySummary en la inicialización y después de cambios (si ya existe init, añade la llamada allí)
document.addEventListener('DOMContentLoaded', () => {
  // esperar un poco para que otras inicializaciones (p. ej. cargarCategorias) terminen
  setTimeout(() => loadInventorySummary(2), 300);
});

// Si en tu código ya llamas a cargarProductos() después de crear/eliminar, añade también loadInventorySummary()
// Ejemplo: después de eliminar o crear producto:
async function afterProductsChanged() {
  try {
    await loadInventorySummary();
    // si tienes función cargarProductos, llámala también para actualizar tabla:
    if (typeof cargarProductos === 'function') {
      cargarProductos();
    }
  } catch (e) {
    console.warn('afterProductsChanged', e);
  }
}

// ========== NUEVO: funcionalidad de productos en el menú ==========

document.addEventListener('DOMContentLoaded', () => {
    const safeLog = (...args) => console.log('[Menu | Productos]', ...args);

    const productSearch = document.getElementById('productSearch');
    const filterCategory = document.getElementById('filterCategory');
    const filterSupplier = document.getElementById('filterSupplier');
    const btnSearchProducts = document.getElementById('btnSearchProducts');
    const productsTbody = document.querySelector('#productsTable tbody');
    const saveProductBtn = document.getElementById('saveProductBtn');

    const selectPCategory = document.getElementById('p_category');
    const selectPSupplier = document.getElementById('p_supplier');

    let productos = [];
    let currentFilters = {};

    async function fetchJson(url, opts = {}) {
        const res = await fetch(url, opts);
        if (!res.ok) {
            const txt = await res.text().catch(()=> '');
            throw new Error(`HTTP ${res.status} - ${txt}`);
        }
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            const txt = await res.text();
            throw new Error('Respuesta no JSON: ' + (txt.slice(0,200)));
        }
        return await res.json();
    }

    async function cargarCategorias() {
        try {
            const data = await fetchJson('/api/categorias/');
            if (!filterCategory) return;
            filterCategory.innerHTML = '<option value="">Todas Categorias</option>';
            if (selectPCategory) selectPCategory.innerHTML = '<option value="">Seleccione categoría</option>';
            if (Array.isArray(data) && data.length) {
                data.forEach(c => {
                    const id = c.id_categoria ?? c.id;
                    const nombre = c.nombre_categoria ?? c.nombre;
                    const option = `<option value="${id}">${nombre}</option>`;
                    filterCategory.insertAdjacentHTML('beforeend', option);
                    if (selectPCategory) selectPCategory.insertAdjacentHTML('beforeend', option);
                });
            } else {
                const none = '<option value="">No hay categorías</option>';
                filterCategory.insertAdjacentHTML('beforeend', none);
                if (selectPCategory) selectPCategory.insertAdjacentHTML('beforeend', none);
            }
        } catch (err) {
            console.error('cargarCategorias', err);
            if (filterCategory) filterCategory.innerHTML = '<option value="">Error al cargar</option>';
            if (selectPCategory) selectPCategory.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    async function cargarProveedores() {
        try {
            const data = await fetchJson('/api/proveedores/');
            if (!filterSupplier) return;
            filterSupplier.innerHTML = '<option value="">Todos Proveedores</option>';
            if (selectPSupplier) selectPSupplier.innerHTML = '<option value="">Seleccione proveedor</option>';
            if (Array.isArray(data) && data.length) {
                data.forEach(p => {
                    const id = p.id_proveedor ?? p.id;
                    const nombre = p.nombre_proveedor ?? p.nombre;
                    const option = `<option value="${id}">${nombre}</option>`;
                    filterSupplier.insertAdjacentHTML('beforeend', option);
                    if (selectPSupplier) selectPSupplier.insertAdjacentHTML('beforeend', option);
                });
            } else {
                const none = '<option value="">No hay proveedores</option>';
                filterSupplier.insertAdjacentHTML('beforeend', none);
                if (selectPSupplier) selectPSupplier.insertAdjacentHTML('beforeend', none);
            }
        } catch (err) {
            console.error('cargarProveedores', err);
            if (filterSupplier) filterSupplier.innerHTML = '<option value="">Error al cargar</option>';
            if (selectPSupplier) selectPSupplier.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    async function cargarProductos(filters = null) {
        try {
            if (filters) currentFilters = filters;
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.category) params.set('category', currentFilters.category);
            if (currentFilters.supplier) params.set('supplier', currentFilters.supplier);

            const url = '/api/productos/' + (params.toString() ? `?${params.toString()}` : '');
            const data = await fetchJson(url);
            productos = Array.isArray(data) ? data : [];
            renderTabla(productos);
        } catch (err) {
            console.error('cargarProductos', err);
            if (productsTbody) productsTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No se pudo cargar productos</td></tr>';
        }
    }

    function renderTabla(lista) {
        if (!productsTbody) return;
        productsTbody.innerHTML = '';
        if (!Array.isArray(lista) || lista.length === 0) {
            productsTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin productos</td></tr>';
            return;
        }
        lista.forEach(prod => {
            const nombre = prod.nombre_producto ?? '';
            const id = prod.id_producto ?? prod.id ?? '';
            const categoria = prod.nombre_categoria ?? prod.categoria_nombre ?? (prod.id_categoria ?? '');
            const stock = prod.stock_actual ?? 0;
            const exp = prod.fecha_vencimiento ?? '-';
            const proveedor = prod.nombre_proveedor ?? prod.proveedor_nombre ?? '';
            productsTbody.insertAdjacentHTML('beforeend', `
                <tr>
                  <td>${nombre}</td>
                  <td>${id}</td>
                  <td>${categoria}</td>
                  <td>${stock}</td>
                  <td>${exp}</td>
                  <td>${proveedor}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${id}">Eliminar</button>
                  </td>
                </tr>
            `);
        });

        // attach delete handlers
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (!confirm('¿Eliminar producto?')) return;
                try {
                    const res = await fetch(`/api/productos/${id}/`, { method: 'DELETE' });
                    if (!res.ok) {
                        const txt = await res.text().catch(()=>'');
                        throw new Error(txt || res.status);
                    }
                    await cargarProductos(currentFilters);
                    alert('Producto eliminado ✅');
                } catch (err) {
                    console.error('Eliminar producto', err);
                    alert('Error al eliminar (ver consola).');
                }
            });
        });
    }

    // búsqueda local (tecleado)
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            const q = (e.target.value || '').toLowerCase();
            const filtrados = productos.filter(p => (p.nombre_producto ?? '').toString().toLowerCase().includes(q));
            renderTabla(filtrados);
        });
    }

    // botón buscar (manda al servidor)
    if (btnSearchProducts) {
        btnSearchProducts.addEventListener('click', () => {
            const search = (productSearch?.value || '').trim();
            const category = filterCategory?.value || '';
            const supplier = filterSupplier?.value || '';
            cargarProductos({ search, category, supplier });
        });
    }

    // Guardar producto desde modal (igual que inventario)
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async () => {
            const nombre = (document.querySelector('#p_name')?.value || '').trim();
            const idProducto = (document.querySelector('#p_sku')?.value || '').trim();
            const id_categoria = parseInt(document.querySelector('#p_category')?.value) || null;
            const id_proveedor = parseInt(document.querySelector('#p_supplier')?.value) || null;
            const stock_actual = parseInt(document.querySelector('#p_stock')?.value) || 0;
            const precio_venta = parseFloat(document.querySelector('#p_pv')?.value) || 0;
            const precio_compra = parseFloat(document.querySelector('#p_pc')?.value) || null;
            const fecha_vencimiento = document.querySelector('#p_exp')?.value || null;
            const descripcion_producto = (document.querySelector('#p_desc')?.value || '').trim();

            if (!nombre || !idProducto) {
                alert('Nombre y Código/ID son obligatorios.');
                return;
            }

            const nuevo = {
                nombre_producto: nombre,
                id_producto: idProducto,
                id_categoria,
                id_proveedor,
                stock_actual,
                precio_venta,
                precio_compra,
                fecha_vencimiento,
                descripcion_producto
            };

            try {
                const res = await fetch('/api/productos/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevo)
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    console.error('POST /api/productos falló', res.status, txt);
                    alert('Error al guardar producto (ver consola).');
                    return;
                }
                alert('Producto agregado correctamente ✅');
                document.querySelector('#productForm')?.reset();
                try { bootstrap.Modal.getInstance(document.querySelector('#productModal'))?.hide(); } catch (e) { }
                cargarProductos();
            } catch (err) {
                console.error('Error enviando nuevo producto:', err);
                alert('Error de conexión con el servidor (ver consola).');
            }
        });
    }

    // Inicializar selects y tabla
    (async () => {
        try {
            await Promise.all([cargarCategorias(), cargarProveedores(), cargarProductos()]);
            safeLog('Productos inicializados');
        } catch (err) {
            safeLog('Inicialización parcial', err);
        }
    })();
});
