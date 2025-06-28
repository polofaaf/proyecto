// Datos del administrador
const ADMIN_EMAIL = "admin@hotel.com";
const ADMIN_PASSWORD = "admin123";

// Función para mostrar alertas
function showAlert(formId, message, type) {
    const alertDiv = document.getElementById(formId + 'Alert');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.classList.remove('hidden');
    
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 5000);
}

// Función para cambiar entre formularios
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loadingScreen').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loadingScreen').classList.add('hidden');
}

function showLoadingScreen() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loadingScreen').classList.remove('hidden');
}

// Función de inicio de sesión
function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAlert('login', 'Por favor completa todos los campos', 'error');
        return;
    }

    // Verificar usuarios registrados
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        showAlert('login', `¡Bienvenido ${user.role === 'admin' ? 'Administrador' : 'Usuario'}!`, 'success');
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role
        }));
        
        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
            // Redirigir según el rol del usuario
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'usuarios.html';
            }
        }, 1500); // Aumentar el tiempo para evitar cambios rápidos
    } else {
        showAlert('login', 'Correo o contraseña incorrectos', 'error');
    }
}

// Función de registro
function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showAlert('register', 'Por favor completa todos los campos', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('register', 'Las contraseñas no coinciden', 'error');
        return;
    }

    // Validar caracteres específicos de la contraseña
    if (!validatePassword()) {
        showAlert('register', 'La contraseña debe cumplir con todos los requisitos de seguridad', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('register', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    // Verificar si el correo ya existe
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        showAlert('register', 'Este correo ya está registrado', 'error');
        return;
    }

    // Determinar el rol del usuario
    let role = 'user';
    
    // Si es el primer usuario registrado, hacerlo admin
    if (users.length === 0) {
        role = 'admin';
    }
    
    // Si el email contiene "admin", hacerlo administrador
    if (email.toLowerCase().includes('admin')) {
        role = 'admin';
    }

    // Agregar nuevo usuario
    const newUser = {
        name: name,
        email: email,
        password: password,
        role: role
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const roleMessage = role === 'admin' ? 'como Administrador' : 'como Usuario';
    showAlert('register', `¡Registro exitoso ${roleMessage}! Redirigiendo al inicio de sesión...`, 'success');
    
    // Mostrar pantalla de carga
    showLoadingScreen();
    
    // Redirigir al inicio de sesión después de 3 segundos
    setTimeout(() => {
        showLoginForm();
        // Limpiar formulario de registro
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';
    }, 3000);
}

// Event listeners para envío con Enter
document.addEventListener('DOMContentLoaded', function() {
    // Solo configurar event listeners si estamos en la página de registro/login
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const registerName = document.getElementById('registerName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerConfirmPassword = document.getElementById('registerConfirmPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginPassword.focus();
            }
        });
    }

    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }

    if (registerName) {
        registerName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                registerEmail.focus();
            }
        });
    }

    if (registerEmail) {
        registerEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                registerPassword.focus();
            }
        });
    }

    if (registerPassword) {
        registerPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                registerConfirmPassword.focus();
            }
        });
    }

    if (registerConfirmPassword) {
        registerConfirmPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                register();
            }
        });
    }
}); 

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Función para validar contraseña con caracteres específicos
function validatePassword() {
    const password = document.getElementById('registerPassword').value;
    const strengthDiv = document.getElementById('password-strength');
    
    if (!password) {
        strengthDiv.className = 'password-strength';
        strengthDiv.style.display = 'none';
        return false;
    }
    
    // Requisitos de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    
    let strength = 0;
    let requirements = [];
    
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    if (hasMinLength) strength++;
    
    // Mostrar requisitos faltantes
    if (!hasUpperCase) requirements.push('Mayúscula');
    if (!hasLowerCase) requirements.push('Minúscula');
    if (!hasNumbers) requirements.push('Número');
    if (!hasSpecialChar) requirements.push('Carácter especial');
    if (!hasMinLength) requirements.push('Mínimo 8 caracteres');
    
    let strengthClass = '';
    let strengthText = '';
    
    if (strength < 3) {
        strengthClass = 'weak';
        strengthText = 'Contraseña débil';
    } else if (strength < 5) {
        strengthClass = 'medium';
        strengthText = 'Contraseña media';
    } else {
        strengthClass = 'strong';
        strengthText = 'Contraseña fuerte';
    }
    
    if (requirements.length > 0) {
        strengthDiv.className = 'password-strength requirements';
        strengthDiv.innerHTML = `<strong>Requisitos faltantes:</strong> ${requirements.join(', ')}`;
    } else {
        strengthDiv.className = `password-strength ${strengthClass}`;
        strengthDiv.textContent = strengthText;
    }
    
    return strength === 5;
} 