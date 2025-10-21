// =========================================
// FUNCIÓN PARA OBTENER CSRF TOKEN
// =========================================

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

const csrftoken = getCookie('csrftoken');

// =========================================
// FUNCIONES PARA VALIDACIÓN
// =========================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateUsername(username) {
    return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
}

function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `alert-message ${type}`;
    messageElement.style.display = 'block';
    
    // Auto-hide después de 5 segundos
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// =========================================
// FUNCIONES PARA LOGIN
// =========================================

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('.role.active').textContent.toLowerCase();

    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userId', data.usuario.userId);
            localStorage.setItem('username', data.usuario.username);
            localStorage.setItem('userRole', data.usuario.role);
            window.location.href = 'menu/';
        } else {
            showMessage('login-message', data.message || data.detail || 'Usuario o contraseña incorrectos', 'error');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showMessage('login-message', 'Error de conexión. Intenta más tarde.', 'error');
    }
});

// =========================================
// FUNCIONES PARA REGISTRO
// =========================================

// Toggle entre login y registro
document.getElementById('register-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-modal').style.display = 'flex';
});

// Cerrar modal de registro
document.getElementById('close-register').addEventListener('click', () => {
    document.getElementById('register-modal').style.display = 'none';
});

// Cerrar modal cuando se hace clic fuera
window.addEventListener('click', (e) => {
    const registerModal = document.getElementById('register-modal');
    const forgotModal = document.getElementById('forgot-modal');
    
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
    if (e.target === forgotModal) {
        forgotModal.style.display = 'none';
    }
});

// Toggle de rol en registro
document.querySelectorAll('.register-role').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.register-role').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Envío del formulario de registro
document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const role = document.querySelector('.register-role.active').dataset.role;

    // Validaciones
    if (!validateEmail(email)) {
        showMessage('register-message', 'Por favor ingresa un correo válido', 'error');
        return;
    }

    if (!validateUsername(username)) {
        showMessage('register-message', 'El usuario debe tener al menos 3 caracteres y solo puede contener letras, números, - y _', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showMessage('register-message', 'La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showMessage('register-message', 'Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password,
                password_confirm: passwordConfirm,
                rol: role
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');
            
            // Limpiar formulario
            document.getElementById('registerForm').reset();
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                document.getElementById('register-modal').style.display = 'none';
                // Llenar el formulario de login con el usuario registrado
                document.getElementById('username').value = username;
                document.getElementById('password').value = '';
            }, 2000);
        } else {
            const errorMsg = data.message || data.username?.[0] || data.email?.[0] || 'Error al registrar el usuario';
            showMessage('register-message', errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error al registrar:', error);
        showMessage('register-message', 'Error de conexión. Intenta más tarde.', 'error');
    }
});

// =========================================
// FUNCIONES PARA OLVIDAR CONTRASEÑA
// =========================================

const forgotModal = document.getElementById("forgot-modal");
const forgotLink = document.getElementById("forgot-link");
const forgotCloseBtn = document.getElementById("close-register") || document.querySelector(".close");

forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    forgotModal.style.display = "flex";
});

// Role toggle en login
const roles = document.querySelectorAll(".role");
roles.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        roles.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

