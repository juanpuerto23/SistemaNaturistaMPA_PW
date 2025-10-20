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
        logoutBtn.addEventListener('click', async function() {
            try {
                const csrftoken = getCookie('csrftoken');
                const response = await fetch('/api/auth/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    credentials: 'same-origin'
                });

                if (response.ok) {
                    // Limpiar localStorage
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('username');
                    localStorage.removeItem('userRole');
                    
                    // Redirigir a la página de login
                    window.location.href = '/';
                } else {
                    alert('Error al cerrar sesión');
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error de conexión');
            }
        });
    }
});
