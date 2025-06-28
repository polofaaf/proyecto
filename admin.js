// Variables globales
let currentAdmin = null;
let allUsers = [];
let filteredUsers = [];

// Variables globales para el panel de administración
let rooms = [];
let reservations = [];
let contactInfo = {};
let currentUser = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado como admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'registro.html';
        return;
    }
    
    // Inicializar habitaciones si no existen
    initializeRooms();
    
    // Cargar datos iniciales una sola vez
    loadEmails();
    loadRooms();
    loadRecentFeedbacks();
    
    // Configurar event listeners
    setupAdminEventListeners();
    
    // Mostrar mensaje de bienvenida solo una vez
    if (!localStorage.getItem('adminWelcomeShown')) {
        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido al Panel de Administración!',
            text: `Hola ${currentUser.name}, puedes gestionar correos, habitaciones y comentarios desde aquí.`,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
        localStorage.setItem('adminWelcomeShown', 'true');
    }
});

function checkAdminAccess() {
    // Verificar si el usuario está logueado y es administrador
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        redirectToMain();
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    if (currentUser.role !== 'admin') {
        redirectToMain();
        return;
    }
}

function redirectToMain() {
    Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para acceder al panel de administración'
    }).then(() => {
        window.location.href = 'index.html';
    });
}

function setupAdminEventListeners() {
    // Formulario para agregar habitación
    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm) {
        addRoomForm.addEventListener('submit', handleAddRoom);
    }
    
    // Formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleUpdateContact);
    }
    
    // Cargar datos iniciales en formularios
    loadContactFormData();
}

function loadAdminContent() {
    loadExistingRooms();
    loadReservations();
    loadContactPreview();
    loadUsersList(); // Cargar usuarios automáticamente
}

// Funciones de navegación entre pestañas
function showAdminSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Activar pestaña seleccionada
    event.target.classList.add('active');
    
    // Recargar contenido específico si es necesario
    if (sectionName === 'users') {
        loadUsersList();
    }
}

// Funciones de gestión de usuarios
function loadUsersList() {
    const usersListDiv = document.getElementById('usersList');
    if (!usersListDiv) return;
    
    // Obtener usuarios del localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.length === 0) {
        usersListDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay usuarios registrados en el sistema.</p>';
        return;
    }
    
    usersListDiv.innerHTML = users.map(user => `
        <div class="user-item" style="border: 1px solid #ddd; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; background: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #333;">${user.name}</h4>
                    <p style="margin: 0.25rem 0; color: #666;"><strong>Email:</strong> ${user.email}</p>
                    <p style="margin: 0.25rem 0; color: #666;"><strong>Rol:</strong> 
                        <span style="color: ${user.role === 'admin' ? '#dc3545' : '#28a745'}; font-weight: bold; padding: 2px 8px; border-radius: 4px; background: ${user.role === 'admin' ? '#f8d7da' : '#d4edda'};">
                            ${user.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
                        </span>
                    </p>
                </div>
                <div>
                    ${user.email !== currentUser.email ? 
                        `<button onclick="deleteUser('${user.email}')" style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: 600; transition: background 0.3s ease;">
                            🗑️ Eliminar Usuario
                        </button>` :
                        `<span style="color: #6c757d; font-style: italic; padding: 10px 15px; background: #e9ecef; border-radius: 5px;">👤 Usuario actual</span>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function deleteUser(userEmail) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userToDelete = users.find(u => u.email === userEmail);
    
    if (!userToDelete) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Usuario no encontrado'
        });
        return;
    }
    
    Swal.fire({
        title: '¿Eliminar usuario?',
        html: `
            <p>¿Estás seguro de que quieres eliminar al usuario:</p>
            <p><strong>${userToDelete.name}</strong></p>
            <p><strong>Email:</strong> ${userToDelete.email}</p>
            <p><strong>Rol:</strong> ${userToDelete.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
            <p style="color: #dc3545; font-weight: bold;">⚠️ Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Eliminar usuario
            const updatedUsers = users.filter(u => u.email !== userEmail);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Recargar lista de usuarios
            loadUsersList();
            
            Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                text: `El usuario "${userToDelete.name}" ha sido eliminado exitosamente del sistema.`
            });
        }
    });
}

// Funciones de habitaciones
function handleAddRoom(e) {
    e.preventDefault();
    
    const name = document.getElementById('roomName').value;
    const price = parseInt(document.getElementById('roomPrice').value);
    const description = document.getElementById('roomDescription').value;
    const imagesInput = document.getElementById('roomImages').value;
    const amenitiesInput = document.getElementById('roomAmenities').value;
    
    // Validar precio mínimo
    if (price < 250) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El precio mínimo debe ser de $250 MXN'
        });
        return;
    }
    
    // Procesar imágenes y amenidades
    const images = imagesInput.split(',').map(img => img.trim()).filter(img => img);
    const amenities = amenitiesInput.split(',').map(amenity => amenity.trim()).filter(amenity => amenity);
    
    if (images.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Debes proporcionar al menos una imagen'
        });
        return;
    }
    
    // Crear nueva habitación
    const newRoom = {
        id: Date.now(),
        name: name,
        price: price,
        description: description,
        status: 'available',
        images: images,
        amenities: amenities
    };
    
    rooms.push(newRoom);
    saveDataToStorage();
    
    // Limpiar formulario
    document.getElementById('addRoomForm').reset();
    
    // Recargar lista de habitaciones
    loadExistingRooms();
    
    Swal.fire({
        icon: 'success',
        title: '¡Habitación agregada!',
        text: 'La nueva habitación ha sido agregada exitosamente'
    });
}

function loadExistingRooms() {
    const existingRoomsDiv = document.getElementById('existingRooms');
    if (!existingRoomsDiv) return;
    
    if (rooms.length === 0) {
        existingRoomsDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay habitaciones registradas</p>';
        return;
    }
    
    existingRoomsDiv.innerHTML = rooms.map(room => `
        <div class="room-admin-item" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0;">${room.name}</h4>
                    <p style="margin: 0.25rem 0;"><strong>Precio:</strong> $${room.price} MXN</p>
                    <p style="margin: 0.25rem 0;"><strong>Estado:</strong> 
                        <span style="color: ${room.status === 'available' ? 'green' : 'red'}; font-weight: bold;">
                            ${room.status === 'available' ? '✅ Disponible' : '❌ Ocupada'}
                        </span>
                    </p>
                </div>
                <div>
                    <button onclick="toggleRoomStatus(${room.id})" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin-right: 8px;">
                        ${room.status === 'available' ? '🔒 Marcar Ocupada' : '🔓 Marcar Disponible'}
                    </button>
                    <button onclick="deleteRoom(${room.id})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleRoomStatus(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        room.status = room.status === 'available' ? 'occupied' : 'available';
        saveDataToStorage();
        loadExistingRooms();
        
        Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `La habitación "${room.name}" ahora está ${room.status === 'available' ? 'disponible' : 'ocupada'}`
        });
    }
}

function deleteRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    
    Swal.fire({
        title: '¿Eliminar habitación?',
        text: `¿Quieres eliminar la habitación "${room.name}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            rooms = rooms.filter(r => r.id !== roomId);
            saveDataToStorage();
            loadExistingRooms();
            
            Swal.fire({
                icon: 'success',
                title: 'Habitación eliminada',
                text: 'La habitación ha sido eliminada exitosamente'
            });
        }
    });
}

// Funciones de reservas
function loadReservations() {
    const reservationsListDiv = document.getElementById('reservationsList');
    if (!reservationsListDiv) return;
    
    if (reservations.length === 0) {
        reservationsListDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay reservas activas</p>';
        return;
    }
    
    reservationsListDiv.innerHTML = reservations.map(reservation => `
        <div class="reservation-item" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0;">${reservation.roomName}</h4>
                    <p style="margin: 0.25rem 0;"><strong>Cliente:</strong> ${reservation.userName} (${reservation.userId})</p>
                    <p style="margin: 0.25rem 0;"><strong>Precio:</strong> $${reservation.price} MXN</p>
                    <p style="margin: 0.25rem 0;"><strong>Fecha de reserva:</strong> ${new Date(reservation.date).toLocaleDateString()}</p>
                    <p style="margin: 0.25rem 0;"><strong>Estado:</strong> 
                        <span style="color: ${reservation.status === 'confirmed' ? 'green' : 'orange'}; font-weight: bold;">
                            ${reservation.status === 'confirmed' ? '✅ Confirmada' : '⏳ Pendiente'}
                        </span>
                    </p>
                </div>
                <div>
                    <button onclick="cancelReservation(${reservation.id})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                        ❌ Cancelar Reserva
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para cancelar reserva desde el panel de habitaciones
function cancelReservation(reservationId) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró la reserva'
        });
        return;
    }
    
    const reservationType = reservation.type === 'purchase' ? 'Compra' : 'Reserva';
    
    Swal.fire({
        title: `¿Cancelar ${reservationType.toLowerCase()}?`,
        text: `¿Estás seguro de que quieres cancelar la ${reservationType.toLowerCase()} de ${reservation.userName} para la ${reservation.roomName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
    }).then((result) => {
        if (result.isConfirmed) {
            // Eliminar la reserva
            const updatedReservations = reservations.filter(r => r.id !== reservationId);
            localStorage.setItem('reservations', JSON.stringify(updatedReservations));
            
            // Actualizar estado de la habitación
            const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
            const room = rooms.find(r => r.id === reservation.roomId);
            if (room) {
                // Verificar si hay otras reservas para esta habitación
                const otherReservations = updatedReservations.filter(r => r.roomId === reservation.roomId);
                if (otherReservations.length === 0) {
                    room.status = 'available';
                } else {
                    // Si hay otras reservas, usar la más reciente
                    const latestReservation = otherReservations[otherReservations.length - 1];
                    room.status = latestReservation.type === 'purchase' ? 'occupied' : 'reserved';
                }
                localStorage.setItem('rooms', JSON.stringify(rooms));
            }
            
            // Recargar la vista de habitaciones
            loadRooms();
            
            Swal.fire({
                icon: 'success',
                title: `${reservationType} cancelada`,
                text: `La ${reservationType.toLowerCase()} ha sido cancelada exitosamente`
            });
        }
    });
}

// Funciones de contacto
function loadContactFormData() {
    const addressInput = document.getElementById('contactAddress');
    const phoneInput = document.getElementById('contactPhone');
    const emailInput = document.getElementById('contactEmail');
    const hoursInput = document.getElementById('contactHours');
    
    if (contactInfo.address && addressInput) addressInput.value = contactInfo.address;
    if (contactInfo.phone && phoneInput) phoneInput.value = contactInfo.phone;
    if (contactInfo.email && emailInput) emailInput.value = contactInfo.email;
    if (contactInfo.hours && hoursInput) hoursInput.value = contactInfo.hours;
}

function handleUpdateContact(e) {
    e.preventDefault();
    
    const address = document.getElementById('contactAddress').value;
    const phone = document.getElementById('contactPhone').value;
    const email = document.getElementById('contactEmail').value;
    const hours = document.getElementById('contactHours').value;
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor ingresa un email válido'
        });
        return;
    }
    
    // Actualizar información de contacto
    contactInfo = {
        address: address,
        phone: phone,
        email: email,
        hours: hours
    };
    
    saveDataToStorage();
    loadContactPreview();
    
    Swal.fire({
        icon: 'success',
        title: 'Información actualizada',
        text: 'La información de contacto ha sido actualizada exitosamente'
    });
}

function loadContactPreview() {
    const contactPreviewDiv = document.getElementById('contactPreview');
    if (!contactPreviewDiv) return;
    
    if (!contactInfo.address) {
        contactPreviewDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay información de contacto configurada</p>';
        return;
    }
    
    contactPreviewDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
            <h4 style="margin: 0 0 1rem 0; color: #333;">Vista previa:</h4>
            <p style="margin: 0.5rem 0;"><strong>📍 Dirección:</strong> ${contactInfo.address}</p>
            <p style="margin: 0.5rem 0;"><strong>📞 Teléfono:</strong> ${contactInfo.phone}</p>
            <p style="margin: 0.5rem 0;"><strong>📧 Email:</strong> ${contactInfo.email}</p>
            <p style="margin: 0.5rem 0;"><strong>🕒 Horarios:</strong> ${contactInfo.hours}</p>
        </div>
    `;
}

// Funciones de almacenamiento
function saveDataToStorage() {
    localStorage.setItem('hotelRooms', JSON.stringify(rooms));
    localStorage.setItem('hotelReservations', JSON.stringify(reservations));
    localStorage.setItem('hotelContactInfo', JSON.stringify(contactInfo));
}

function loadDataFromStorage() {
    const savedRooms = localStorage.getItem('hotelRooms');
    const savedReservations = localStorage.getItem('hotelReservations');
    const savedContactInfo = localStorage.getItem('hotelContactInfo');
    
    if (savedRooms) rooms = JSON.parse(savedRooms);
    if (savedReservations) reservations = JSON.parse(savedReservations);
    if (savedContactInfo) contactInfo = JSON.parse(savedContactInfo);
}

// Función para cargar y mostrar correos
function loadEmails() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const emailsList = document.getElementById('emailsList');
    
    if (users.length === 0) {
        emailsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay correos registrados</p>';
        return;
    }
    
    let emailsHTML = '<div class="emails-grid">';
    users.forEach(user => {
        // No mostrar el botón eliminar para el administrador actual
        const deleteButton = user.role === 'admin' ? '' : 
            `<button class="btn-delete-email" onclick="deleteEmail('${user.email}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                <i class="fas fa-trash"></i> Eliminar
            </button>`;
        
        emailsHTML += `
            <div class="email-card" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #333;">${user.name}</h4>
                        <p style="margin: 0; color: #666;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 0.5rem 0 0 0; color: #666;"><strong>Rol:</strong> 
                            <span style="color: ${user.role === 'admin' ? '#dc3545' : '#28a745'}">
                                ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                            </span>
                        </p>
                    </div>
                    <div>
                        ${deleteButton}
                    </div>
                </div>
            </div>
        `;
    });
    emailsHTML += '</div>';
    
    emailsList.innerHTML = emailsHTML;
}

// Función para eliminar correo/usuario
function deleteEmail(email) {
    Swal.fire({
        title: '¿Eliminar usuario?',
        text: `¿Estás seguro de que quieres eliminar el usuario con email "${email}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Obtener usuarios actuales
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Filtrar el usuario a eliminar
            const updatedUsers = users.filter(user => user.email !== email);
            
            // Guardar usuarios actualizados
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Recargar la lista de correos
            loadEmails();
            
            Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                text: 'El usuario ha sido eliminado exitosamente'
            });
        }
    });
}

// Función para cargar habitaciones con reservas
function loadRooms() {
    const rooms = JSON.parse(localStorage.getItem('rooms')) || [];
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const roomsList = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay habitaciones registradas</p>';
        return;
    }
    
    // Actualizar estados de habitaciones basándose en las reservas
    const updatedRooms = rooms.map(room => {
        const roomReservations = reservations.filter(r => r.roomId === room.id);
        let status = 'available';
        
        if (roomReservations.length > 0) {
            const latestReservation = roomReservations[roomReservations.length - 1];
            status = latestReservation.type === 'purchase' ? 'occupied' : 'reserved';
        }
        
        return { ...room, status };
    });
    
    // Guardar habitaciones actualizadas
    localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    
    let roomsHTML = '<div class="rooms-grid">';
    updatedRooms.forEach(room => {
        // Buscar reservas para esta habitación
        const roomReservations = reservations.filter(r => r.roomId === room.id);
        const isReserved = roomReservations.length > 0;
        
        let status = 'Disponible';
        let statusClass = 'available';
        let reservationInfo = '';
        
        if (isReserved) {
            status = room.status === 'occupied' ? 'Ocupada' : 'Reservada';
            statusClass = room.status === 'occupied' ? 'occupied' : 'reserved';
            
            // Mostrar información de la reserva
            roomReservations.forEach(reservation => {
                const reservationType = reservation.type === 'purchase' ? 'Compra' : 'Reserva';
                reservationInfo += `
                    <div style="background: #f8f9fa; padding: 0.8rem; margin-top: 0.5rem; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0 0 0.3rem 0;"><strong>Cliente:</strong> ${reservation.userName}</p>
                        <p style="margin: 0 0 0.3rem 0;"><strong>Email:</strong> ${reservation.userId}</p>
                        <p style="margin: 0 0 0.3rem 0;"><strong>Tipo:</strong> ${reservationType}</p>
                        <p style="margin: 0 0 0.3rem 0;"><strong>Precio:</strong> $${reservation.price} MXN</p>
                        <p style="margin: 0 0 0.3rem 0;"><strong>Fecha:</strong> ${new Date(reservation.date).toLocaleDateString()}</p>
                        <p style="margin: 0;"><strong>Estado:</strong> 
                            <span style="color: ${reservation.status === 'confirmed' ? 'green' : 'orange'}">
                                ${reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </span>
                        </p>
                        <button onclick="cancelReservation(${reservation.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-top: 0.5rem; font-size: 0.8rem;">
                            <i class="fas fa-times"></i> Cancelar ${reservationType}
                        </button>
                    </div>
                `;
            });
        }
        
        roomsHTML += `
            <div class="room-status-card ${statusClass}" style="border: 1px solid #ddd; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 10px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #333;">${room.name} #${room.id}</h4>
                        <p style="margin: 0 0 0.5rem 0; color: #666;">${room.description}</p>
                        <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: #667eea;">$${room.price} MXN</p>
                    </div>
                    <span class="room-status ${statusClass}" style="display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; background: ${statusClass === 'available' ? '#d4edda' : statusClass === 'reserved' ? '#fff3cd' : '#f8d7da'}; color: ${statusClass === 'available' ? '#155724' : statusClass === 'reserved' ? '#856404' : '#721c24'};">
                        ${status}
                    </span>
                </div>
                ${reservationInfo}
            </div>
        `;
    });
    roomsHTML += '</div>';
    
    roomsList.innerHTML = roomsHTML;
}

// Función para mostrar sección de habitaciones
function showRooms() {
    document.getElementById('emails-section').classList.remove('active');
    document.getElementById('rooms-section').classList.add('active');
}

// Función para mostrar sección de correos
function showEmails() {
    document.getElementById('rooms-section').classList.remove('active');
    document.getElementById('emails-section').classList.add('active');
}

// Función para cerrar sesión
function logout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: 'Serás redirigido al login',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('currentUser');
            window.location.href = 'registro.html';
        }
    });
}

// Función para configurar los botones de navegación
function setupNavigationButtons() {
    const adminNav = document.querySelector('.admin-nav');
    const logoutButton = adminNav.querySelector('button');
    
    // Crear botón de habitaciones
    const roomsButton = document.createElement('button');
    roomsButton.innerHTML = '<i class="fas fa-bed"></i> Habitaciones';
    roomsButton.onclick = showRooms;
    roomsButton.style.marginRight = '10px';
    
    // Crear botón de gestión de habitaciones
    const manageRoomsButton = document.createElement('button');
    manageRoomsButton.innerHTML = '<i class="fas fa-cogs"></i> Gestionar Habitaciones';
    manageRoomsButton.onclick = () => window.location.href = 'admin-habitaciones.html';
    manageRoomsButton.style.marginRight = '10px';
    
    // Crear botón de correos
    const emailsButton = document.createElement('button');
    emailsButton.innerHTML = '<i class="fas fa-envelope"></i> Correos';
    emailsButton.onclick = showEmails;
    emailsButton.style.marginRight = '10px';
    
    // Crear botón de gestión de comentarios
    const feedbackButton = document.createElement('button');
    feedbackButton.innerHTML = '<i class="fas fa-comments"></i> Comentarios';
    feedbackButton.onclick = () => window.location.href = 'admin-feedback.html';
    feedbackButton.style.marginRight = '10px';
    
    // Insertar botones antes del botón de logout
    adminNav.insertBefore(feedbackButton, logoutButton);
    adminNav.insertBefore(emailsButton, logoutButton);
    adminNav.insertBefore(manageRoomsButton, logoutButton);
    adminNav.insertBefore(roomsButton, logoutButton);
}

// Función para inicializar habitaciones en localStorage
function initializeRooms() {
    const existingRooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    
    if (existingRooms.length === 0) {
        // Datos de las habitaciones por defecto
        const defaultRooms = [
            {
                id: 1,
                name: 'Habitación Individual',
                description: 'Habitación cómoda para una persona con cama individual, baño privado y vista a la ciudad.',
                price: 80,
                type: 'individual',
                status: 'available'
            },
            {
                id: 2,
                name: 'Habitación Individual Premium',
                description: 'Habitación individual de lujo con amenities premium y vista panorámica.',
                price: 120,
                type: 'individual',
                status: 'available'
            },
            {
                id: 3,
                name: 'Habitación Doble',
                description: 'Habitación espaciosa con dos camas individuales, ideal para viajeros de negocios o amigos.',
                price: 150,
                type: 'doble',
                status: 'available'
            },
            {
                id: 4,
                name: 'Habitación Doble Matrimonial',
                description: 'Habitación romántica con cama matrimonial y decoración elegante.',
                price: 180,
                type: 'doble',
                status: 'available'
            },
            {
                id: 5,
                name: 'Suite Ejecutiva',
                description: 'Suite de lujo con sala de estar separada, jacuzzi y servicios premium.',
                price: 350,
                type: 'suite',
                status: 'available'
            },
            {
                id: 6,
                name: 'Suite Familiar',
                description: 'Suite espaciosa perfecta para familias con múltiples habitaciones.',
                price: 400,
                type: 'suite',
                status: 'available'
            },
            {
                id: 7,
                name: 'Suite Presidencial',
                description: 'La experiencia más exclusiva con servicios de lujo y atención personalizada.',
                price: 800,
                type: 'presidencial',
                status: 'available'
            },
            {
                id: 8,
                name: 'Suite Presidencial Premium',
                description: 'La máxima expresión de lujo con terraza privada y vistas espectaculares.',
                price: 1200,
                type: 'presidencial',
                status: 'available'
            }
        ];
        
        localStorage.setItem('rooms', JSON.stringify(defaultRooms));
    }
}

// Función para cargar comentarios recientes en el panel de administración
function loadRecentFeedbacks() {
    const recentFeedbacksDiv = document.getElementById('recentFeedbacks');
    if (!recentFeedbacksDiv) return;
    
    // Obtener comentarios del localStorage
    let feedbacks = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
    
    // Si no hay comentarios, agregar algunos de prueba
    if (feedbacks.length === 0) {
        const testFeedbacks = [
            {
                id: Date.now(),
                name: "María González",
                email: "maria@ejemplo.com",
                rating: 5,
                comment: "Excelente servicio y habitaciones muy limpias. El personal fue muy amable y atento. Definitivamente volveré.",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: Date.now() + 1,
                name: "Carlos Rodríguez",
                email: "carlos@ejemplo.com",
                rating: 4,
                comment: "Muy buena experiencia en general. Las habitaciones son cómodas y la ubicación es perfecta.",
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: Date.now() + 2,
                name: "Ana Martínez",
                email: "ana@ejemplo.com",
                rating: 5,
                comment: "Increíble estadía. El desayuno estaba delicioso y las instalaciones son de primera calidad.",
                date: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('customerFeedbacks', JSON.stringify(testFeedbacks));
        feedbacks = testFeedbacks;
    }
    
    if (feedbacks.length === 0) {
        recentFeedbacksDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay comentarios de clientes aún.</p>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero) y tomar solo los últimos 5
    const recentFeedbacks = feedbacks
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentFeedbacksDiv.innerHTML = recentFeedbacks.map(feedback => `
        <div style="border: 1px solid #ddd; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; background: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #333;">${feedback.name}</h4>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 12px;">${feedback.email}</p>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 12px;">${formatDate(feedback.date)}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div class="stars" style="gap: 2px;">
                        ${generateStars(feedback.rating)}
                    </div>
                    <span style="color: #666; font-size: 12px;">${feedback.rating}/5</span>
                </div>
            </div>
            <div style="color: #333; line-height: 1.4; margin-bottom: 10px;">
                ${feedback.comment.length > 100 
                    ? feedback.comment.substring(0, 100) + '...' 
                    : feedback.comment}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <button onclick="confirmDeleteFeedback(${feedback.id})" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 12px; transition: background 0.3s ease;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
    
    // Si hay más de 5 comentarios, mostrar un enlace para ver todos
    if (feedbacks.length > 5) {
        recentFeedbacksDiv.innerHTML += `
            <div style="text-align: center; margin-top: 1rem; color: #666; font-size: 12px;">
                Mostrando los últimos 5 comentarios de ${feedbacks.length} totales
            </div>
        `;
    }
}

// Función para generar estrellas (reutilizada del archivo admin-feedback.js)
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'active' : ''}" style="font-size: 14px; color: ${i <= rating ? '#ffd700' : '#ddd'};"></i>`;
    }
    return stars;
}

// Función para formatear fecha (reutilizada del archivo admin-feedback.js)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para confirmar eliminación de comentario desde el panel principal
function confirmDeleteFeedback(feedbackId) {
    const feedbacks = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
    const feedback = feedbacks.find(f => f.id === feedbackId);
    
    if (!feedback) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Comentario no encontrado'
        });
        return;
    }
    
    Swal.fire({
        title: '¿Eliminar comentario?',
        html: `
            <p>¿Estás seguro de que quieres eliminar el comentario de:</p>
            <p><strong>${feedback.name}</strong></p>
            <p style="color: #dc3545; font-weight: bold;">⚠️ Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Eliminar comentario
            const updatedFeedbacks = feedbacks.filter(f => f.id !== feedbackId);
            localStorage.setItem('customerFeedbacks', JSON.stringify(updatedFeedbacks));
            
            // Recargar comentarios recientes
            loadRecentFeedbacks();
            
            Swal.fire({
                icon: 'success',
                title: 'Comentario eliminado',
                text: `El comentario de "${feedback.name}" ha sido eliminado exitosamente.`
            });
        }
    });
}

// Función para mostrar secciones del panel de administración
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar estilos de los botones
    const buttons = document.querySelectorAll('.admin-nav button');
    buttons.forEach(button => {
        if (button.textContent.toLowerCase().includes(sectionName)) {
            button.style.background = 'rgba(255, 255, 255, 0.3)';
        } else {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
        }
    });
    
    // Cargar contenido específico si es necesario
    if (sectionName === 'feedback') {
        loadRecentFeedbacks();
    } else if (sectionName === 'emails') {
        loadEmails();
    } else if (sectionName === 'rooms') {
        loadRooms();
    }
} 