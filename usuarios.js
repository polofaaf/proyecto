// Variables globales
let currentUser = null;
let userReservations = [];
let currentTab = 'reservations';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadUserData();
});

// Verificar sesión del usuario
function checkUserSession() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        Swal.fire({
            title: 'Acceso Requerido',
            text: 'Debes iniciar sesión para acceder al panel de usuario',
            icon: 'warning',
            confirmButtonText: 'Ir al Login'
        }).then(() => {
            window.location.href = 'registro.html';
        });
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Verificar que no sea admin
    if (currentUser.role === 'admin') {
        Swal.fire({
            title: 'Acceso Denegado',
            text: 'Los administradores deben usar el panel de administración',
            icon: 'error',
            confirmButtonText: 'Ir al Panel Admin'
        }).then(() => {
            window.location.href = 'admin.html';
        });
        return;
    }
    
    document.getElementById('userInfo').innerHTML = `
        <p><strong>Usuario:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
    `;
}

// Cargar datos del usuario
function loadUserData() {
    loadUserReservations();
    updateStatistics();
    showWelcomeMessage();
}

// Cargar reservas del usuario
function loadUserReservations() {
    const allReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    userReservations = allReservations.filter(reservation => 
        reservation.userId === currentUser.email
    );
    
    displayReservations();
    displayPurchases();
    displayAllBookings();
}

// Mostrar reservas
function displayReservations() {
    const reservationsGrid = document.getElementById('reservationsGrid');
    const userReservationsOnly = userReservations.filter(r => r.type === 'reservation');
    
    if (userReservationsOnly.length === 0) {
        reservationsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-calendar-times"></i>
                <h3>No tienes reservas</h3>
                <p>Aún no has hecho ninguna reserva de habitación</p>
                <a href="habitaciones.html" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-bed"></i> Ver Habitaciones Disponibles
                </a>
            </div>
        `;
        return;
    }
    
    let reservationsHTML = '';
    userReservationsOnly.forEach(reservation => {
        reservationsHTML += createReservationCard(reservation);
    });
    
    reservationsGrid.innerHTML = reservationsHTML;
}

// Mostrar compras
function displayPurchases() {
    const purchasesGrid = document.getElementById('purchasesGrid');
    const userPurchasesOnly = userReservations.filter(r => r.type === 'purchase');
    
    if (userPurchasesOnly.length === 0) {
        purchasesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-shopping-cart"></i>
                <h3>No tienes compras</h3>
                <p>Aún no has comprado ninguna habitación</p>
                <a href="habitaciones.html" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-bed"></i> Ver Habitaciones Disponibles
                </a>
            </div>
        `;
        return;
    }
    
    let purchasesHTML = '';
    userPurchasesOnly.forEach(purchase => {
        purchasesHTML += createReservationCard(purchase);
    });
    
    purchasesGrid.innerHTML = purchasesHTML;
}

// Mostrar todas las reservas y compras
function displayAllBookings() {
    const allGrid = document.getElementById('allGrid');
    
    if (userReservations.length === 0) {
        allGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-list"></i>
                <h3>No tienes reservas ni compras</h3>
                <p>Aún no has hecho ninguna reserva o compra de habitación</p>
                <a href="habitaciones.html" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-bed"></i> Ver Habitaciones Disponibles
                </a>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedBookings = userReservations.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    let allHTML = '';
    sortedBookings.forEach(booking => {
        allHTML += createReservationCard(booking);
    });
    
    allGrid.innerHTML = allHTML;
}

// Crear tarjeta de reserva/compra
function createReservationCard(booking) {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const typeClass = booking.type === 'reservation' ? 'type-reservation' : 'type-purchase';
    const typeText = booking.type === 'reservation' ? 'Reserva' : 'Compra';
    const typeIcon = booking.type === 'reservation' ? 'calendar-check' : 'shopping-cart';
    
    const paymentMethod = booking.paymentMethod ? 
        `<p><strong>Método de pago:</strong> ${booking.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</p>` : '';
    
    return `
        <div class="reservation-card">
            <div class="reservation-header">
                <span class="reservation-type ${typeClass}">
                    <i class="fas fa-${typeIcon}"></i> ${typeText}
                </span>
                <span style="color: #28a745; font-weight: 600;">
                    <i class="fas fa-check-circle"></i> Confirmado
                </span>
            </div>
            
            <div class="reservation-title">${booking.roomName}</div>
            
            <div class="reservation-details">
                <p><strong>Usuario:</strong> ${booking.userName}</p>
                <p><strong>Email:</strong> ${booking.userId}</p>
                ${paymentMethod}
            </div>
            
            <div class="reservation-price">$${booking.price} MXN</div>
            
            <div class="reservation-date">
                <i class="fas fa-clock"></i> ${formattedDate}
            </div>
            
            <div class="reservation-actions">
                <button class="btn btn-warning" onclick="viewBookingDetails(${booking.id})">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                <button class="btn btn-danger" onclick="cancelBooking(${booking.id})">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;
}

// Ver detalles de la reserva/compra
function viewBookingDetails(bookingId) {
    const booking = userReservations.find(b => b.id === bookingId);
    if (!booking) return;
    
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const paymentMethod = booking.paymentMethod ? 
        `<p><strong>Método de pago:</strong> ${booking.paymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Efectivo'}</p>` : '';
    
    Swal.fire({
        title: `Detalles de ${booking.type === 'reservation' ? 'Reserva' : 'Compra'}`,
        html: `
            <div style="text-align: left; line-height: 1.6;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #667eea; margin-bottom: 10px;">${booking.roomName}</h4>
                    <p><strong>Tipo:</strong> ${booking.type === 'reservation' ? 'Reserva' : 'Compra'}</p>
                    <p><strong>Precio:</strong> $${booking.price} MXN</p>
                    <p><strong>Estado:</strong> <span style="color: #28a745; font-weight: 600;">Confirmado</span></p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #333; margin-bottom: 10px;">Información del Usuario</h5>
                    <p><strong>Nombre:</strong> ${booking.userName}</p>
                    <p><strong>Email:</strong> ${booking.userId}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #333; margin-bottom: 10px;">Información de Pago</h5>
                    <p><strong>Fecha:</strong> ${formattedDate}</p>
                    ${paymentMethod}
                </div>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <h5 style="color: #667eea; margin-bottom: 10px;">Información Importante</h5>
                    <p style="margin-bottom: 8px;">• Tu ${booking.type === 'reservation' ? 'reserva' : 'compra'} está confirmada</p>
                    <p style="margin-bottom: 8px;">• Presenta tu identificación al momento del check-in</p>
                    <p style="margin-bottom: 8px;">• ${booking.type === 'reservation' ? 'El pago se realizará al momento del check-in' : 'El pago ya ha sido procesado'}</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        width: '600px'
    });
}

// Cancelar reserva/compra
function cancelBooking(bookingId) {
    const booking = userReservations.find(b => b.id === bookingId);
    if (!booking) return;
    
    Swal.fire({
        title: '¿Cancelar Reserva/Compra?',
        text: `¿Estás seguro de que quieres cancelar tu ${booking.type === 'reservation' ? 'reserva' : 'compra'} de "${booking.roomName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Cancelar',
        cancelButtonText: 'No, Mantener'
    }).then((result) => {
        if (result.isConfirmed) {
            // Obtener todas las reservas
            const allReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            
            // Encontrar y eliminar la reserva
            const reservationIndex = allReservations.findIndex(r => r.id === bookingId);
            if (reservationIndex !== -1) {
                allReservations.splice(reservationIndex, 1);
                localStorage.setItem('reservations', JSON.stringify(allReservations));
                
                // Actualizar estado de la habitación
                updateRoomStatus(booking.roomId, 'available');
                
                // Recargar datos
                loadUserData();
                
                Swal.fire({
                    title: 'Cancelado Exitosamente',
                    text: `Tu ${booking.type === 'reservation' ? 'reserva' : 'compra'} ha sido cancelada`,
                    icon: 'success',
                    confirmButtonText: 'Perfecto'
                });
            }
        }
    });
}

// Actualizar estado de la habitación
function updateRoomStatus(roomId, status) {
    const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex !== -1) {
        rooms[roomIndex].status = status;
        localStorage.setItem('rooms', JSON.stringify(rooms));
    }
}

// Actualizar estadísticas
function updateStatistics() {
    const reservations = userReservations.filter(r => r.type === 'reservation');
    const purchases = userReservations.filter(r => r.type === 'purchase');
    
    const totalSpent = userReservations.reduce((total, booking) => total + booking.price, 0);
    const activeBookings = userReservations.length; // Todas las reservas están activas por defecto
    
    document.getElementById('totalReservations').textContent = reservations.length;
    document.getElementById('totalPurchases').textContent = purchases.length;
    document.getElementById('totalSpent').textContent = `$${totalSpent} MXN`;
    document.getElementById('activeBookings').textContent = activeBookings;
    
    // Agregar información sobre limitaciones
    const statsGrid = document.getElementById('statsGrid');
    const existingLimits = document.querySelector('.limits-info');
    
    if (existingLimits) {
        existingLimits.remove();
    }
    
    const limitsInfo = document.createElement('div');
    limitsInfo.className = 'limits-info';
    limitsInfo.style.cssText = `
        grid-column: 1 / -1;
        background: #f8f9fa;
        border-radius: 15px;
        padding: 20px;
        margin-top: 20px;
        text-align: center;
        border-left: 4px solid #667eea;
    `;
    
    const canBuyMore = purchases.length < 2;
    const buyStatus = canBuyMore ? 'success' : 'danger';
    const buyIcon = canBuyMore ? 'check-circle' : 'times-circle';
    const buyColor = canBuyMore ? '#28a745' : '#dc3545';
    
    limitsInfo.innerHTML = `
        <h4 style="color: #667eea; margin-bottom: 15px;">
            <i class="fas fa-info-circle"></i> Límites de Usuario
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid ${buyColor};">
                <i class="fas fa-shopping-cart" style="color: ${buyColor}; font-size: 1.5rem; margin-bottom: 10px;"></i>
                <h5 style="color: #333; margin-bottom: 5px;">Compras</h5>
                <p style="color: #666; margin-bottom: 10px;">${purchases.length}/2 habitaciones</p>
                <div style="background: #e9ecef; height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${buyColor}; height: 100%; width: ${(purchases.length / 2) * 100}%; transition: width 0.3s ease;"></div>
                </div>
                <p style="color: ${buyColor}; font-size: 12px; margin-top: 5px; font-weight: 600;">
                    <i class="fas fa-${buyIcon}"></i> 
                    ${canBuyMore ? `Puedes comprar ${2 - purchases.length} habitación(es) más` : 'Límite de compras alcanzado'}
                </p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107;">
                <i class="fas fa-calendar-check" style="color: #ffc107; font-size: 1.5rem; margin-bottom: 10px;"></i>
                <h5 style="color: #333; margin-bottom: 5px;">Reservas</h5>
                <p style="color: #666; margin-bottom: 10px;">${reservations.length} habitaciones apartadas</p>
                <p style="color: #856404; font-size: 12px; margin-top: 5px; font-weight: 600;">
                    <i class="fas fa-info-circle"></i> 
                    Puedes apartar múltiples habitaciones
                </p>
            </div>
        </div>
    `;
    
    statsGrid.appendChild(limitsInfo);
}

// Mostrar pestaña
function showTab(tabName) {
    currentTab = tabName;
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar contenido seleccionado
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Actualizar datos
function refreshData() {
    loadUserData();
    
    Swal.fire({
        title: 'Datos Actualizados',
        text: 'La información ha sido actualizada correctamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Hacer nueva reserva
function makeNewReservation() {
    const purchases = userReservations.filter(r => r.type === 'purchase');
    const reservations = userReservations.filter(r => r.type === 'reservation');
    const canBuyMore = purchases.length < 2;
    
    let buyButtonText = '<i class="fas fa-shopping-cart"></i> Comprar';
    let buyButtonColor = '#28a745';
    let buyButtonDisabled = false;
    
    if (!canBuyMore) {
        buyButtonText = '<i class="fas fa-times-circle"></i> Límite Alcanzado';
        buyButtonColor = '#6c757d';
        buyButtonDisabled = true;
    }
    
    Swal.fire({
        title: 'Nueva Reserva',
        html: `
            <div style="text-align: center;">
                <p style="margin-bottom: 20px;">¿Qué tipo de reserva te gustaría hacer?</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Compras: ${purchases.length}/2</span>
                        <span>Reservas: ${reservations.length}</span>
                    </div>
                    <div style="background: #e9ecef; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="background: #667eea; height: 100%; width: ${(purchases.length / 2) * 100}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="fas fa-calendar-check"></i> Apartar ($250)',
        denyButtonText: buyButtonText,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ffc107',
        denyButtonColor: buyButtonColor,
        cancelButtonColor: '#6c757d',
        allowOutsideClick: !buyButtonDisabled
    }).then((result) => {
        if (result.isConfirmed) {
            // Ir a habitaciones para hacer reserva
            window.location.href = 'habitaciones.html?action=reserve';
        } else if (result.isDenied && canBuyMore) {
            // Ir a habitaciones para hacer compra
            window.location.href = 'habitaciones.html?action=buy';
        } else if (result.isDenied && !canBuyMore) {
            // Mostrar mensaje de límite alcanzado
            Swal.fire({
                title: 'Límite de Compras Alcanzado',
                text: 'Ya has comprado el máximo de 2 habitaciones permitidas.',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#667eea'
            });
        }
    });
}

// Cerrar sesión
function logout() {
    Swal.fire({
        title: '¿Cerrar Sesión?',
        text: '¿Estás seguro de que quieres cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Cerrar Sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('currentUser');
            window.location.href = 'registro.html';
        }
    });
}

// Exportar reservas del usuario
function exportUserData() {
    if (userReservations.length === 0) {
        Swal.fire({
            title: 'Sin Datos',
            text: 'No tienes reservas para exportar',
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    // Crear contenido del archivo
    const exportData = {
        usuario: {
            nombre: currentUser.name,
            email: currentUser.email,
            fechaExportacion: new Date().toISOString()
        },
        reservas: userReservations.map(booking => ({
            id: booking.id,
            tipo: booking.type === 'reservation' ? 'Reserva' : 'Compra',
            habitacion: booking.roomName,
            precio: booking.price,
            fecha: new Date(booking.date).toLocaleDateString('es-ES'),
            metodoPago: booking.paymentMethod || 'No especificado',
            estado: 'Confirmado'
        })),
        estadisticas: {
            totalReservas: userReservations.filter(r => r.type === 'reservation').length,
            totalCompras: userReservations.filter(r => r.type === 'purchase').length,
            totalGastado: userReservations.reduce((total, booking) => total + booking.price, 0)
        }
    };
    
    // Crear archivo JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    // Descargar archivo
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `reservas_${currentUser.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Swal.fire({
        title: 'Datos Exportados',
        text: 'Tus reservas han sido exportadas correctamente',
        icon: 'success',
        confirmButtonText: 'Perfecto'
    });
}

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    // Verificar si ya se mostró el mensaje de bienvenida para este usuario
    const welcomeShown = localStorage.getItem(`userWelcomeShown_${currentUser.email}`);
    
    if (!welcomeShown) {
        Swal.fire({
            title: '¡Bienvenido al Panel de Usuario!',
            html: `
                <div style="text-align: center;">
                    <i class="fas fa-user-circle" style="font-size: 4rem; color: #667eea; margin-bottom: 1rem;"></i>
                    <h3>¡Hola ${currentUser.name}!</h3>
                    <p style="margin-bottom: 1rem;">Bienvenido a tu panel de usuario del sistema de hotel.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 1rem 0;">
                        <h5 style="color: #667eea; margin-bottom: 10px;">¿Qué puedes hacer aquí?</h5>
                        <ul style="text-align: left; margin: 0; padding-left: 20px;">
                            <li>Ver todas tus reservas y compras</li>
                            <li>Hacer nuevas reservas de habitaciones</li>
                            <li>Comprar habitaciones directamente</li>
                            <li>Cancelar reservas si es necesario</li>
                            <li>Ver estadísticas de tus gastos</li>
                        </ul>
                    </div>
                    <p style="color: #666; font-size: 14px;">¡Comienza explorando las habitaciones disponibles!</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: '¡Empezar!',
            confirmButtonColor: '#667eea',
            width: '500px'
        });
        
        // Marcar que ya se mostró el mensaje para este usuario
        localStorage.setItem(`userWelcomeShown_${currentUser.email}`, 'true');
    }
} 