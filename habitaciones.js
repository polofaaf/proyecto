// Variables globales
let currentUser = null;
let currentFilter = 'all';
let selectedRoom = null;
let selectedAction = null;
let allRooms = []; // Todas las habitaciones sin filtrar

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadRoomsFromStorage();
    generateAmenityFilters();
    generateCapacityFilters();
    updateRoomStatuses();
    
    // Actualizar habitaciones cada 5 segundos para sincronización
    setInterval(updateRoomsFromStorage, 5000);
    setInterval(updateRoomStatuses, 3000);
});

// Verificar sesión del usuario
function checkUserSession() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        Swal.fire({
            title: 'Acceso Requerido',
            text: 'Debes iniciar sesión para acceder a las habitaciones',
            icon: 'warning',
            confirmButtonText: 'Ir al Login'
        }).then(() => {
            window.location.href = 'registro.html';
        });
        return;
    }
    
    currentUser = JSON.parse(userData);
    document.getElementById('userName').textContent = `Usuario: ${currentUser.name} (${currentUser.email})`;
}

// Generar filtros de amenidades dinámicamente
function generateAmenityFilters() {
    const amenityFilter = document.getElementById('amenityFilter');
    const amenityNames = {
        'wifi': 'Con WiFi',
        'tv': 'Con TV',
        'ac': 'Con Aire Acondicionado',
        'pool': 'Con Piscina',
        'balcony': 'Con Balcón',
        'jacuzzi': 'Con Jacuzzi',
        'kitchen': 'Con Cocina',
        'minibar': 'Con Minibar'
    };
    
    // Obtener todas las amenidades disponibles
    const availableAmenities = new Set();
    allRooms.forEach(room => {
        if (room.amenities) {
            Object.keys(room.amenities).forEach(amenity => {
                if (room.amenities[amenity] === true) {
                    availableAmenities.add(amenity);
                }
            });
        }
    });
    
    // Limpiar opciones existentes excepto la primera
    while (amenityFilter.children.length > 1) {
        amenityFilter.removeChild(amenityFilter.lastChild);
    }
    
    // Agregar opciones basadas en las amenidades disponibles
    availableAmenities.forEach(amenity => {
        if (amenityNames[amenity]) {
            const option = document.createElement('option');
            option.value = amenity;
            option.textContent = amenityNames[amenity];
            amenityFilter.appendChild(option);
        }
    });
}

// Generar filtros de capacidad dinámicamente
function generateCapacityFilters() {
    const capacityFilter = document.getElementById('capacityFilter');
    const capacities = [...new Set(allRooms.map(room => room.capacity).filter(cap => cap > 0))].sort((a, b) => a - b);
    
    if (capacities.length === 0) return;
    
    // Limpiar opciones existentes excepto la primera
    while (capacityFilter.children.length > 1) {
        capacityFilter.removeChild(capacityFilter.lastChild);
    }
    
    // Agregar opciones basadas en las capacidades disponibles
    capacities.forEach(capacity => {
        const option = document.createElement('option');
        option.value = capacity;
        option.textContent = `${capacity} persona${capacity !== 1 ? 's' : ''}`;
        capacityFilter.appendChild(option);
    });
    
    // Agregar opción para 5+ personas si hay habitaciones con capacidad alta
    if (capacities.some(cap => cap >= 5)) {
        const option = document.createElement('option');
        option.value = '5';
        option.textContent = '5+ personas';
        capacityFilter.appendChild(option);
    }
}

// Cargar habitaciones desde localStorage
function loadRoomsFromStorage() {
    const storedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
    
    if (storedRooms.length === 0) {
        // Si no hay habitaciones, mostrar mensaje
        const roomsGrid = document.getElementById('roomsGrid');
        roomsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-bed" style="font-size: 4rem; margin-bottom: 1rem; color: #ddd;"></i>
                <h3>No hay habitaciones disponibles</h3>
                <p>El administrador aún no ha agregado habitaciones al sistema</p>
            </div>
        `;
        return;
    }
    
    // Convertir las habitaciones del formato del admin al formato del usuario
    allRooms = storedRooms.map(room => ({
        id: room.id,
        type: room.type,
        title: room.name,
        name: room.name,
        description: room.description,
        price: room.price,
        status: room.status || 'available',
        capacity: room.capacity || 2,
        amenities: room.amenities || {},
        features: generateFeaturesFromRoom(room),
        image: getRoomImage(room.type),
        floor: room.floor
    }));
    
    // Generar filtros dinámicamente
    generateTypeFilters();
    
    // Mostrar todas las habitaciones inicialmente
    displayFilteredRooms(allRooms);
    showResultsCount(allRooms.length);
}

// Generar filtros de tipo dinámicamente
function generateTypeFilters() {
    const typeFilterButtons = document.getElementById('typeFilterButtons');
    const existingButtons = typeFilterButtons.querySelectorAll('.filter-btn');
    
    // Mantener solo el botón "Todas"
    existingButtons.forEach((btn, index) => {
        if (index > 0) {
            btn.remove();
        }
    });
    
    // Obtener tipos únicos de habitaciones
    const uniqueTypes = [...new Set(allRooms.map(room => room.type))];
    
    // Crear botones para cada tipo
    uniqueTypes.forEach(type => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.onclick = () => filterRooms(type);
        
        // Capitalizar el nombre del tipo
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        button.textContent = typeName;
        
        typeFilterButtons.appendChild(button);
    });
}

// Generar características basadas en la información de la habitación
function generateFeaturesFromRoom(room) {
    const features = [];
    
    // Agregar características básicas
    if (room.bathrooms > 0) {
        features.push(`${room.bathrooms} baño${room.bathrooms > 1 ? 's' : ''}`);
    }
    
    if (room.beds > 0) {
        features.push(`${room.beds} cama${room.beds > 1 ? 's' : ''}`);
    }
    
    if (room.capacity > 0) {
        features.push(`${room.capacity} persona${room.capacity > 1 ? 's' : ''}`);
    }
    
    // Agregar amenidades
    if (room.amenities) {
        if (room.amenities.wifi) features.push('WiFi');
        if (room.amenities.tv) features.push('TV');
        if (room.amenities.ac) features.push('Aire Acondicionado');
        if (room.amenities.pool) features.push('Piscina');
        if (room.amenities.balcony) features.push('Balcón');
        if (room.amenities.jacuzzi) features.push('Jacuzzi');
        if (room.amenities.kitchen) features.push('Cocina');
        if (room.amenities.minibar) features.push('Minibar');
    }
    
    // Agregar vista
    if (room.view && room.view !== 'none') {
        const viewNames = {
            'city': 'Vista a la Ciudad',
            'ocean': 'Vista al Océano',
            'mountain': 'Vista a la Montaña',
            'garden': 'Vista al Jardín'
        };
        features.push(viewNames[room.view] || 'Vista Especial');
    }
    
    // Agregar decoración
    if (room.decoration) {
        const decorationNames = {
            'modern': 'Decoración Moderna',
            'classic': 'Decoración Clásica',
            'rustic': 'Decoración Rústica',
            'luxury': 'Decoración de Lujo',
            'minimalist': 'Decoración Minimalista'
        };
        features.push(decorationNames[room.decoration] || 'Decoración Especial');
    }
    
    return features;
}

// Obtener imagen basada en el tipo de habitación
function getRoomImage(type) {
    const imageMap = {
        'individual': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=200&fit=crop',
        'doble': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=200&fit=crop',
        'suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=200&fit=crop',
        'presidencial': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=200&fit=crop'
    };
    
    return imageMap[type] || imageMap['individual'];
}

// Cargar habitaciones
function loadRooms() {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';
    
    const filteredRooms = currentFilter === 'all' 
        ? allRooms 
        : allRooms.filter(room => room.type === currentFilter);
    
    filteredRooms.forEach(room => {
        const roomCard = createRoomCard(room);
        roomsGrid.appendChild(roomCard);
    });
}

// Crear tarjeta de habitación
function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    
    const statusClass = `status-${room.status}`;
    const statusText = getStatusText(room.status);
    
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    // Obtener información del usuario actual
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const userPurchases = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'purchase'
    );
    const userReservations = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'reservation'
    );
    
    // Determinar si los botones deben estar deshabilitados
    const isRoomAvailable = room.status === 'available';
    const canBuy = isRoomAvailable && userPurchases.length < 2;
    const canReserve = isRoomAvailable;
    
    // Crear mensajes informativos
    let buyButtonText = `Comprar ($${room.price})`;
    let reserveButtonText = 'Apartar ($250)';
    let buyButtonClass = 'btn btn-buy';
    let reserveButtonClass = 'btn btn-reserve';
    
    if (!isRoomAvailable) {
        buyButtonText = 'No Disponible';
        reserveButtonText = 'No Disponible';
        buyButtonClass += ' btn-disabled';
        reserveButtonClass += ' btn-disabled';
    } else if (!canBuy) {
        buyButtonText = 'Límite Alcanzado';
        buyButtonClass += ' btn-disabled';
    }
    
    card.innerHTML = `
        <div class="room-image" style="background-image: url('${room.image}')">
            <div class="room-status ${statusClass}">${statusText}</div>
        </div>
        <div class="room-info">
            <h3 class="room-title">${roomTitle}</h3>
            <p class="room-description">${room.description}</p>
            <div class="room-features">
                ${(room.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
            </div>
            <div class="room-price">$${room.price}/noche</div>
            
            <!-- Información del usuario -->
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #666;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Compras: ${userPurchases.length}/2</span>
                    <span>Reservas: ${userReservations.length}</span>
                </div>
                <div style="background: #e9ecef; height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="background: #667eea; height: 100%; width: ${(userPurchases.length / 2) * 100}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <div class="room-actions">
                <button class="${reserveButtonClass}" 
                        onclick="reserveRoom(${room.id})" 
                        ${!canReserve ? 'disabled' : ''}>
                    ${reserveButtonText}
                </button>
                <button class="${buyButtonClass}" 
                        onclick="buyRoom(${room.id})" 
                        ${!canBuy ? 'disabled' : ''}>
                    ${buyButtonText}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Obtener texto del estado
function getStatusText(status) {
    switch(status) {
        case 'available': return 'Disponible';
        case 'occupied': return 'Ocupada';
        case 'reserved': return 'Reservada';
        default: return 'Disponible';
    }
}

// Función de búsqueda mejorada
function searchRooms() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    let filteredRooms = allRooms.filter(room => {
        // 1. Filtro por búsqueda de texto (nombre de habitación, descripción)
        const matchesSearch = !searchTerm || 
            (room.name && room.name.toLowerCase().includes(searchTerm)) ||
            (room.title && room.title.toLowerCase().includes(searchTerm)) ||
            (room.description && room.description.toLowerCase().includes(searchTerm));
        
        // 2. Filtro por tipo (mantiene el filtro actual de botones)
        const matchesType = currentFilter === 'all' || room.type === currentFilter;
        
        return matchesSearch && matchesType;
    });
    
    displayFilteredRooms(filteredRooms);
    
    // Mostrar contador de resultados
    showResultsCount(filteredRooms.length);
}

// Mostrar ayuda sobre los filtros
function showFilterHelp() {
    Swal.fire({
        title: 'Cómo Usar los Filtros',
        html: `
            <div style="text-align: left; line-height: 1.6;">
                <h4 style="color: #667eea; margin-bottom: 15px;">Guía de Filtros de Búsqueda</h4>
                
                <div style="margin-bottom: 15px;">
                    <strong>🔍 Búsqueda por Texto:</strong>
                    <p>Busca habitaciones por nombre, descripción o características específicas.</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>🏠 Filtro por Tipo:</strong>
                    <p>Selecciona el tipo de habitación que prefieres (Individual, Doble, Suite, etc.).</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <strong>💡 Consejos:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Puedes combinar la búsqueda por texto con el filtro por tipo</li>
                        <li>Si no encuentras resultados, intenta con términos de búsqueda diferentes</li>
                        <li>Usa "Limpiar Filtros" para ver todas las habitaciones disponibles</li>
                        <li>El filtro por tipo te ayuda a encontrar habitaciones específicas</li>
                    </ul>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        width: '500px'
    });
}

// Mostrar contador de resultados
function showResultsCount(count) {
    const roomsGrid = document.getElementById('roomsGrid');
    const existingCounter = document.querySelector('.results-counter');
    
    if (existingCounter) {
        existingCounter.remove();
    }
    
    if (count > 0) {
        const counter = document.createElement('div');
        counter.className = 'results-counter';
        counter.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
            color: #667eea;
            font-weight: 600;
        `;
        counter.innerHTML = `
            <i class="fas fa-search"></i> 
            Se encontraron ${count} habitación${count !== 1 ? 'es' : ''} que coinciden con tus criterios
        `;
        roomsGrid.insertBefore(counter, roomsGrid.firstChild);
    }
}

// Función de filtrado mejorada
function filterRooms(type) {
    currentFilter = type;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Aplicar todos los filtros
    searchRooms();
}

// Mostrar habitaciones filtradas
function displayFilteredRooms(filteredRooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';
    
    if (filteredRooms.length === 0) {
        const searchTerm = document.getElementById('searchInput').value;
        
        let message = 'No se encontraron habitaciones que coincidan con tus criterios de búsqueda.';
        let suggestions = [];
        
        if (searchTerm) {
            suggestions.push('Intenta con términos de búsqueda diferentes');
        }
        if (currentFilter !== 'all') {
            suggestions.push('Prueba con otros tipos de habitación');
        }
        
        if (suggestions.length > 0) {
            message += '<br><br><strong>Sugerencias:</strong><br>' + suggestions.join('<br>• ');
        }
        
        roomsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 1rem; color: #ddd;"></i>
                <h3>No se encontraron habitaciones</h3>
                <p style="line-height: 1.6;">${message}</p>
                <button onclick="clearFilters()" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem; font-size: 14px;">
                    <i class="fas fa-times"></i> Limpiar Filtros
                </button>
            </div>
        `;
        return;
    }
    
    filteredRooms.forEach(room => {
        const roomCard = createRoomCard(room);
        roomsGrid.appendChild(roomCard);
    });
}

// Limpiar todos los filtros
function clearFilters() {
    // Limpiar búsqueda
    document.getElementById('searchInput').value = '';
    
    // Resetear filtro de tipo
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-btn').classList.add('active');
    
    // Regenerar filtros de tipo dinámicamente
    generateTypeFilters();
    
    // Mostrar todas las habitaciones
    displayFilteredRooms(allRooms);
    
    // Mostrar contador de resultados
    showResultsCount(allRooms.length);
    
    // Mostrar mensaje de confirmación
    Swal.fire({
        title: 'Filtros Limpiados',
        text: 'Se han limpiado todos los filtros de búsqueda',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Reservar habitación
function reserveRoom(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room || room.status !== 'available') {
        Swal.fire({
            title: 'Habitación No Disponible',
            text: 'Esta habitación no está disponible para reservar',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    selectedRoom = room;
    selectedAction = 'reserve';
    
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    // Verificar reservas existentes del usuario
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const userReservations = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'reservation'
    );
    
    Swal.fire({
        title: 'Apartar Habitación',
        html: `
            <div style="text-align: center;">
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                    <h4 style="color: #856404; margin-bottom: 10px;">${roomTitle}</h4>
                    <p style="font-size: 24px; font-weight: bold; color: #ffc107; margin-bottom: 10px;">$250 MXN</p>
                    <p style="color: #856404; margin-bottom: 5px;">Reservas activas: ${userReservations.length}</p>
                    <p style="color: #856404; font-size: 14px;">Esta es una reserva temporal que aparta la habitación</p>
                </div>
                <p style="color: #666; font-size: 14px;">¿Confirmas que quieres apartar esta habitación?</p>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-calendar-check"></i> Sí, Apartar',
        cancelButtonText: '<i class="fas fa-arrow-left"></i> Regresar'
    }).then((result) => {
        if (result.isConfirmed) {
            reserveRoomConfirmed();
        }
        // Si se cancela, simplemente regresa sin hacer nada
    });
}

// Comprar habitación
function buyRoom(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room || room.status !== 'available') {
        Swal.fire({
            title: 'Habitación No Disponible',
            text: 'Esta habitación no está disponible para comprar',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    // Verificar límite de compras del usuario (máximo 2 habitaciones)
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const userPurchases = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'purchase'
    );
    
    if (userPurchases.length >= 2) {
        Swal.fire({
            title: 'Límite de Compras Alcanzado',
            text: 'Ya has comprado el máximo de 2 habitaciones permitidas. Puedes ver tus compras en tu panel de usuario.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ver Mis Compras',
            cancelButtonText: 'Continuar Explorando',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'usuarios.html';
            }
        });
        return;
    }
    
    selectedRoom = room;
    selectedAction = 'buy';
    
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    // Mostrar información de compra con botón de regresar
    Swal.fire({
        title: 'Confirmar Compra',
        html: `
            <div style="text-align: center;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #667eea; margin-bottom: 10px;">${roomTitle}</h4>
                    <p style="font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 10px;">$${room.price} MXN</p>
                    <p style="color: #666; margin-bottom: 5px;">Compras realizadas: ${userPurchases.length}/2</p>
                    <div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: #667eea; height: 100%; width: ${(userPurchases.length / 2) * 100}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
                <p style="color: #666; font-size: 14px;">Selecciona tu método de pago preferido:</p>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        showCloseButton: true,
        confirmButtonText: '<i class="fas fa-credit-card"></i> Tarjeta',
        denyButtonText: '<i class="fas fa-money-bill-wave"></i> Efectivo',
        cancelButtonText: '<i class="fas fa-arrow-left"></i> Regresar',
        confirmButtonColor: '#28a745',
        denyButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            // Pago con tarjeta
            showCardPaymentForm();
        } else if (result.isDenied) {
            // Pago en efectivo
            showCashPaymentConfirmation();
        }
        // Si se cancela, simplemente regresa sin hacer nada
    });
}

// Mostrar formulario de pago con tarjeta
function showCardPaymentForm() {
    const room = selectedRoom;
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    Swal.fire({
        title: 'Pago con Tarjeta',
        html: `
            <div style="text-align: left;">
                <p><strong>Habitación:</strong> ${roomTitle}</p>
                <p><strong>Total:</strong> $${room.price} MXN</p>
                <hr style="margin: 1rem 0;">
                <div class="form-group">
                    <label for="cardNumber">Número de Tarjeta:</label>
                    <input type="text" id="cardNumber" class="swal2-input" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatCardNumber(this)">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="expiryDate">
                            Fecha de Vencimiento:
                            <i class="fas fa-question-circle" onclick="showExpiryDateHelp()" style="color: #667eea; cursor: pointer; margin-left: 5px;" title="Ayuda con el formato"></i>
                        </label>
                        <input type="text" id="expiryDate" class="swal2-input" placeholder="MM/YY" maxlength="5" oninput="formatExpiryDate(this)" onblur="validateExpiryDateRealTime(this)">
                        <small id="expiryDateHelp" style="color: #666; font-size: 12px; display: none;">Formato: MM/YY (ej: 12/25)</small>
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV:</label>
                        <input type="text" id="cvv" class="swal2-input" placeholder="123" maxlength="4" oninput="formatCVV(this)">
                    </div>
                </div>
                <div class="form-group">
                    <label for="cardName">Nombre en la Tarjeta:</label>
                    <input type="text" id="cardName" class="swal2-input" placeholder="Juan Pérez">
                </div>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #667eea;">
                    <h5 style="color: #667eea; margin-bottom: 10px; font-size: 14px;">🔒 Información de Seguridad</h5>
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        Tus datos de tarjeta están protegidos. Esta es una simulación de pago para fines demostrativos.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Pagar $' + room.price,
        cancelButtonText: '<i class="fas fa-arrow-left"></i> Regresar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        preConfirm: () => {
            const cardNumber = document.getElementById('cardNumber').value;
            const expiryDate = document.getElementById('expiryDate').value;
            const cvv = document.getElementById('cvv').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || !expiryDate || !cvv || !cardName) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }
            
            // Validación mejorada de número de tarjeta
            const cleanCardNumber = cardNumber.replace(/\s/g, '');
            if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
                Swal.showValidationMessage('Número de tarjeta inválido (debe tener entre 13 y 19 dígitos)');
                return false;
            }
            
            // Validación mejorada de fecha de vencimiento
            if (!validateExpiryDate(expiryDate)) {
                Swal.showValidationMessage('Fecha de vencimiento inválida. Verifica el formato MM/YY y que no esté vencida');
                return false;
            }
            
            // Validación mejorada de CVV
            if (cvv.length < 3 || cvv.length > 4) {
                Swal.showValidationMessage('CVV inválido (debe tener 3 o 4 dígitos)');
                return false;
            }
            
            // Validación de nombre
            if (cardName.trim().length < 3) {
                Swal.showValidationMessage('Nombre en la tarjeta debe tener al menos 3 caracteres');
                return false;
            }
            
            return { cardNumber, expiryDate, cvv, cardName };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simular procesamiento de pago
            Swal.fire({
                title: 'Procesando Pago...',
                text: 'Por favor espera mientras procesamos tu tarjeta',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            setTimeout(() => {
                buyRoomConfirmed('tarjeta');
            }, 2000);
        }
    });
}

// Mostrar ejemplos de fechas válidas
function showValidDateExamples() {
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    let examples = [];
    
    // Generar ejemplos para el año actual y siguientes
    for (let year = currentYear; year <= currentYear + 3; year++) {
        for (let month = 1; month <= 12; month++) {
            if (year === currentYear && month < currentMonth) continue;
            
            const monthStr = month.toString().padStart(2, '0');
            const yearStr = year.toString().padStart(2, '0');
            examples.push(`${monthStr}/${yearStr}`);
            
            if (examples.length >= 8) break; // Máximo 8 ejemplos
        }
        if (examples.length >= 8) break;
    }
    
    Swal.fire({
        title: 'Ejemplos de Fechas Válidas',
        html: `
            <div style="text-align: center;">
                <p style="margin-bottom: 15px; color: #666;">Estas fechas son válidas para usar:</p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                    ${examples.map(date => `
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-weight: bold; color: #667eea;">
                            ${date}
                        </div>
                    `).join('')}
                </div>
                <p style="font-size: 12px; color: #999;">
                    Las fechas se generan automáticamente basadas en la fecha actual
                </p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        width: '400px'
    });
}

// Mostrar ayuda sobre formato de fecha de vencimiento
function showExpiryDateHelp() {
    Swal.fire({
        title: 'Formato de Fecha de Vencimiento',
        html: `
            <div style="text-align: center; line-height: 1.6;">
                <i class="fas fa-calendar-alt" style="font-size: 3rem; color: #667eea; margin-bottom: 1rem;"></i>
                <h4 style="color: #333; margin-bottom: 15px;">¿Cómo ingresar la fecha de vencimiento?</h4>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p><strong>Formato requerido:</strong> MM/YY</p>
                    <p><strong>Ejemplos válidos:</strong></p>
                    <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                        <li>12/25 (Diciembre 2025)</li>
                        <li>03/24 (Marzo 2024)</li>
                        <li>08/26 (Agosto 2026)</li>
                    </ul>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h5 style="color: #856404; margin-bottom: 10px;">💡 Consejos:</h5>
                    <ul style="text-align: left; margin: 0; padding-left: 20px;">
                        <li>El formato se aplica automáticamente</li>
                        <li>Solo ingresa los números (MMYY)</li>
                        <li>La barra (/) se agrega automáticamente</li>
                        <li>El mes debe estar entre 01 y 12</li>
                        <li>La fecha no puede estar vencida</li>
                    </ul>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ver Ejemplos',
        cancelButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        width: '500px'
    }).then((result) => {
        if (result.isConfirmed) {
            showValidDateExamples();
        }
    });
}

// Función para formatear número de tarjeta
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

// Función para formatear fecha de vencimiento
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Limitar a 4 dígitos máximo
    if (value.length > 4) {
        value = value.substring(0, 4);
    }
    
    // Validar y corregir mes si es necesario
    if (value.length >= 2) {
        const month = parseInt(value.substring(0, 2));
        
        // Si el mes es mayor a 12, corregir
        if (month > 12) {
            value = '12' + value.substring(2);
        }
        
        // Si el mes es 0, cambiar a 01
        if (month === 0) {
            value = '01' + value.substring(2);
        }
        
        // Si el primer dígito es mayor a 1, agregar 0 al inicio
        if (parseInt(value.charAt(0)) > 1) {
            value = '0' + value;
        }
    }
    
    // Agregar barra después del mes
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    input.value = value;
    
    // Validar en tiempo real si hay suficientes caracteres
    if (value.length === 5) {
        validateExpiryDateRealTime(input);
    }
}

// Función para formatear CVV
function formatCVV(input) {
    let value = input.value.replace(/\D/g, '');
    input.value = value;
}

// Función para validar fecha de vencimiento
function validateExpiryDate(expiryDate) {
    // Verificar formato MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        return false;
    }
    
    const parts = expiryDate.split('/');
    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);
    
    // Validar mes (1-12)
    if (month < 1 || month > 12) {
        return false;
    }
    
    // Obtener año actual (últimos 2 dígitos)
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1; // getMonth() devuelve 0-11
    
    // Validar que la tarjeta no haya expirado
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    
    // Validar que no sea más de 10 años en el futuro
    if (year > currentYear + 10) {
        return false;
    }
    
    return true;
}

// Mostrar confirmación de pago en efectivo
function showCashPaymentConfirmation() {
    const room = selectedRoom;
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    Swal.fire({
        title: 'Pago en Efectivo',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-money-bill-wave" style="font-size: 3rem; color: #17a2b8; margin-bottom: 1rem;"></i>
                <p><strong>Habitación:</strong> ${roomTitle}</p>
                <p><strong>Total a pagar:</strong> $${room.price} MXN</p>
                <p style="color: #666; font-size: 14px; margin-top: 1rem;">
                    Pagarás el monto completo al momento del check-in en la recepción del hotel.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Compra',
        cancelButtonText: '<i class="fas fa-arrow-left"></i> Regresar',
        confirmButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            buyRoomConfirmed('efectivo');
        }
    });
}

// Confirmar reserva
function reserveRoomConfirmed() {
    const room = selectedRoom;
    
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    // Crear reserva unificada
    const reservation = {
        id: Date.now(), // ID único para la reserva
        roomId: room.id,
        roomName: roomTitle,
        userId: currentUser.email,
        userName: currentUser.name,
        price: 250,
        date: new Date().toISOString(),
        status: 'confirmed',
        type: 'reservation'
    };
    
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    
    // Actualizar estado de la habitación
    room.status = 'reserved';
    updateRoomStatuses();
    
    // Obtener el número total de reservas del usuario
    const userReservations = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'reservation'
    );
    
    Swal.fire({
        title: '¡Habitación Apartada!',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-calendar-check" style="font-size: 3rem; color: #ffc107; margin-bottom: 1rem;"></i>
                <p><strong>Habitación:</strong> ${roomTitle}</p>
                <p><strong>Costo de apartado:</strong> $250 MXN</p>
                <p style="color: #856404; font-size: 14px; margin-top: 1rem;">
                    Esta habitación ha sido apartada temporalmente para ti.
                </p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ffc107;">
                    <p style="color: #856404; font-weight: 600; margin: 0;">
                        Reservas activas: ${userReservations.length}
                    </p>
                    <p style="color: #856404; font-size: 12px; margin: 5px 0 0 0;">
                        Puedes apartar múltiples habitaciones según necesites
                    </p>
                </div>
            </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Ver Mis Reservas',
        cancelButtonText: 'Seguir Explorando',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
        window.location.href = 'usuarios.html';
        }
        // Si cancela, se queda en la página de habitaciones
    });
}

// Confirmar compra
function buyRoomConfirmed(paymentMethod) {
    const room = selectedRoom;
    
    // Usar el nombre de la habitación
    const roomTitle = room.name || room.title || 'Habitación';
    
    // Crear compra unificada
    const reservation = {
        id: Date.now(), // ID único para la reserva
        roomId: room.id,
        roomName: roomTitle,
        userId: currentUser.email,
        userName: currentUser.name,
        price: room.price,
        date: new Date().toISOString(),
        status: 'confirmed',
        type: 'purchase',
        paymentMethod: paymentMethod
    };
    
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    
    // Actualizar estado de la habitación
    room.status = 'occupied';
    updateRoomStatuses();
    
    // Obtener el número total de compras del usuario
    const userPurchases = reservations.filter(r => 
        r.userId === currentUser.email && r.type === 'purchase'
    );
    
    Swal.fire({
        title: '¡Compra Exitosa!',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
                <p><strong>Habitación:</strong> ${roomTitle}</p>
                <p><strong>Precio:</strong> $${room.price} MXN</p>
                <p><strong>Método de pago:</strong> ${paymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Efectivo'}</p>
                <p style="color: #666; font-size: 14px; margin-top: 1rem;">
                    ${paymentMethod === 'efectivo' ? 'Pagarás al momento del check-in' : 'El cargo se ha procesado exitosamente'}
                </p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #667eea; font-weight: 600; margin: 0;">
                        Compras realizadas: ${userPurchases.length}/2
                    </p>
                    ${userPurchases.length >= 2 ? 
                        '<p style="color: #dc3545; font-size: 12px; margin: 5px 0 0 0;">¡Has alcanzado el límite de compras!</p>' : 
                        '<p style="color: #28a745; font-size: 12px; margin: 5px 0 0 0;">Puedes comprar ' + (2 - userPurchases.length) + ' habitación(es) más</p>'
                    }
                </div>
            </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Ver Mis Compras',
        cancelButtonText: 'Seguir Explorando',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
        window.location.href = 'usuarios.html';
        }
        // Si cancela, se queda en la página de habitaciones
    });
}

// Actualizar estados de habitaciones
function updateRoomStatuses() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    
    allRooms.forEach(room => {
        const roomReservations = reservations.filter(r => r.roomId === room.id);
        const hasActiveReservation = roomReservations.some(r => 
            r.status === 'active' || r.status === 'confirmed'
        );
        
        if (hasActiveReservation) {
            room.status = 'occupied';
        } else {
            room.status = 'available';
        }
    });
    
    // Actualizar la visualización si hay filtros activos
    if (currentFilter !== 'all') {
        displayFilteredRooms(allRooms.filter(room => room.type === currentFilter));
    } else {
        displayFilteredRooms(allRooms);
    }
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
        confirmButtonText: 'Sí, Cerrar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('currentUser');
            window.location.href = 'registro.html';
        }
    });
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('confirmationModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Validación en tiempo real de fecha de vencimiento
function validateExpiryDateRealTime(input) {
    const helpText = document.getElementById('expiryDateHelp');
    const value = input.value;
    
    if (!value) {
        helpText.style.display = 'none';
        input.style.borderColor = '#e9ecef';
        return;
    }
    
    if (validateExpiryDate(value)) {
        helpText.style.display = 'none';
        input.style.borderColor = '#28a745';
        input.style.backgroundColor = '#f8fff9';
    } else {
        helpText.style.display = 'block';
        helpText.style.color = '#dc3545';
        input.style.borderColor = '#dc3545';
        input.style.backgroundColor = '#fff5f5';
        
        // Mostrar mensaje específico según el error
        if (!/^\d{2}\/\d{2}$/.test(value)) {
            helpText.textContent = 'Formato incorrecto. Usa MM/YY (ej: 12/25)';
        } else {
            const parts = value.split('/');
            const month = parseInt(parts[0]);
            const year = parseInt(parts[1]);
            
            if (month < 1 || month > 12) {
                helpText.textContent = 'Mes inválido. Debe estar entre 01 y 12';
            } else {
                const currentYear = new Date().getFullYear() % 100;
                const currentMonth = new Date().getMonth() + 1;
                
                if (year < currentYear || (year === currentYear && month < currentMonth)) {
                    helpText.textContent = 'Tarjeta vencida. Ingresa una fecha futura';
                } else if (year > currentYear + 10) {
                    helpText.textContent = 'Fecha muy lejana. Máximo 10 años en el futuro';
                }
            }
        }
    }
}

// Función para regresar al panel de usuario
function goToUserPanel() {
    Swal.fire({
        title: '¿Regresar al Panel?',
        text: '¿Quieres regresar a tu panel de usuario para ver tus reservas y compras?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Regresar',
        cancelButtonText: 'Continuar Aquí'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'usuarios.html';
        }
    });
}

// Función para actualizar habitaciones desde localStorage
function updateRoomsFromStorage() {
    const storedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
    
    // Solo actualizar si hay cambios
    const currentRoomIds = allRooms.map(room => room.id).sort().join(',');
    const newRoomIds = storedRooms.map(room => room.id).sort().join(',');
    
    if (currentRoomIds !== newRoomIds) {
        loadRoomsFromStorage();
    }
} 