// Variables globales
let roomTypes = [];
let rooms = [];
let editingTypeId = null;
let editingRoomId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado como admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'registro.html';
        return;
    }
    
    // Cargar datos
    loadRoomTypes();
    loadRooms();
    updateTypeFilter();
});

// ===== GESTIÓN DE TIPOS DE HABITACIÓN =====

// Cargar tipos de habitación
function loadRoomTypes() {
    roomTypes = JSON.parse(localStorage.getItem('roomTypes')) || [];
    const typesGrid = document.getElementById('roomTypesGrid');
    
    if (roomTypes.length === 0) {
        typesGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-layer-group" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
                <p>No hay tipos de habitación registrados</p>
                <p>Haz clic en "Agregar Tipo" para comenzar</p>
            </div>
        `;
        return;
    }
    
    let typesHTML = '';
    roomTypes.forEach(type => {
        typesHTML += `
            <div class="room-type-card">
                <h3>${type.name}</h3>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editRoomType(${type.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteRoomType(${type.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    typesGrid.innerHTML = typesHTML;
}

// Mostrar modal para agregar tipo
function showAddTypeModal() {
    editingTypeId = null;
    document.getElementById('typeModalTitle').textContent = 'Agregar Tipo de Habitación';
    document.getElementById('typeForm').reset();
    document.getElementById('typeModal').style.display = 'block';
}

// Mostrar modal para editar tipo
function editRoomType(typeId) {
    const type = roomTypes.find(t => t.id === typeId);
    if (!type) return;
    
    editingTypeId = typeId;
    document.getElementById('typeModalTitle').textContent = 'Editar Tipo de Habitación';
    
    document.getElementById('typeName').value = type.name;
    
    document.getElementById('typeModal').style.display = 'block';
}

// Cerrar modal de tipo
function closeTypeModal() {
    document.getElementById('typeModal').style.display = 'none';
    editingTypeId = null;
}

// Guardar tipo de habitación
function saveRoomType(event) {
    event.preventDefault();
    
    const name = document.getElementById('typeName').value.trim();
    
    if (!name) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor ingresa el nombre del tipo de habitación'
        });
        return;
    }
    
    if (editingTypeId) {
        // Editar tipo existente
        const typeIndex = roomTypes.findIndex(t => t.id === editingTypeId);
        if (typeIndex !== -1) {
            roomTypes[typeIndex] = {
                ...roomTypes[typeIndex],
                name
            };
        }
    } else {
        // Agregar nuevo tipo
        const newType = {
            id: Date.now(),
            name
        };
        roomTypes.push(newType);
    }
    
    localStorage.setItem('roomTypes', JSON.stringify(roomTypes));
    loadRoomTypes();
    updateTypeFilter();
    closeTypeModal();
    
    Swal.fire({
        icon: 'success',
        title: editingTypeId ? 'Tipo Actualizado' : 'Tipo Agregado',
        text: `El tipo "${name}" ha sido ${editingTypeId ? 'actualizado' : 'agregado'} exitosamente`
    });
}

// Eliminar tipo de habitación
function deleteRoomType(typeId) {
    const type = roomTypes.find(t => t.id === typeId);
    if (!type) return;
    
    // Verificar si hay habitaciones usando este tipo
    const roomsUsingType = rooms.filter(r => r.typeId === typeId);
    if (roomsUsingType.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            text: `Hay ${roomsUsingType.length} habitación(es) usando este tipo. Elimina las habitaciones primero.`
        });
        return;
    }
    
    Swal.fire({
        title: '¿Eliminar tipo?',
        text: `¿Estás seguro de que quieres eliminar el tipo "${type.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            roomTypes = roomTypes.filter(t => t.id !== typeId);
            localStorage.setItem('roomTypes', JSON.stringify(roomTypes));
            loadRoomTypes();
            updateTypeFilter();
            
            Swal.fire({
                icon: 'success',
                title: 'Tipo Eliminado',
                text: `El tipo "${type.name}" ha sido eliminado exitosamente`
            });
        }
    });
}

// ===== GESTIÓN DE HABITACIONES =====

// Cargar habitaciones
function loadRooms() {
    rooms = JSON.parse(localStorage.getItem('rooms')) || [];
    const roomsGrid = document.getElementById('roomsGrid');
    
    if (rooms.length === 0) {
        roomsGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-bed" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
                <p>No hay habitaciones registradas</p>
                <p>Haz clic en "Agregar Habitación" para comenzar</p>
            </div>
        `;
        return;
    }
    
    let roomsHTML = '';
    rooms.forEach(room => {
        const type = roomTypes.find(t => t.id === room.typeId);
        const typeName = type ? type.name : 'Sin tipo';
        
        const features = [];
        if (room.bathrooms > 0) features.push(`${room.bathrooms} baño${room.bathrooms > 1 ? 's' : ''}`);
        if (room.beds > 0) features.push(`${room.beds} cama${room.beds > 1 ? 's' : ''}`);
        if (room.capacity > 0) features.push(`${room.capacity} persona${room.capacity > 1 ? 's' : ''}`);
        
        // Agregar amenidades
        if (room.amenities) {
            if (room.amenities.wifi) features.push('WiFi');
            if (room.amenities.tv) features.push('TV');
            if (room.amenities.ac) features.push('A/C');
            if (room.amenities.pool) features.push('Piscina');
            if (room.amenities.balcony) features.push('Balcón');
            if (room.amenities.jacuzzi) features.push('Jacuzzi');
            if (room.amenities.kitchen) features.push('Cocina');
            if (room.amenities.minibar) features.push('Minibar');
        }
        
        roomsHTML += `
            <div class="room-card">
                <h3>${room.name}</h3>
                <p><strong>Tipo:</strong> ${typeName}</p>
                <p>${room.description}</p>
                <div class="price">$${room.price} MXN</div>
                <div class="room-features">
                    ${features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editRoom(${room.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteRoom(${room.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    roomsGrid.innerHTML = roomsHTML;
}

// Mostrar modal para agregar habitación
function showAddRoomModal() {
    editingRoomId = null;
    document.getElementById('roomModalTitle').textContent = 'Agregar Habitación';
    document.getElementById('roomForm').reset();
    updateRoomTypeOptions();
    document.getElementById('roomModal').style.display = 'block';
}

// Mostrar modal para editar habitación
function editRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    editingRoomId = roomId;
    document.getElementById('roomModalTitle').textContent = 'Editar Habitación';
    
    // Llenar formulario
    document.getElementById('roomName').value = room.name;
    document.getElementById('roomNumber').value = room.number;
    document.getElementById('roomDescription').value = room.description;
    document.getElementById('roomPrice').value = room.price;
    document.getElementById('roomFloor').value = room.floor || '';
    document.getElementById('roomBathrooms').value = room.bathrooms || 1;
    document.getElementById('roomBeds').value = room.beds || 1;
    document.getElementById('roomCapacity').value = room.capacity || 2;
    
    // Seleccionar tipo
    updateRoomTypeOptions();
    document.getElementById('roomType').value = room.typeId;
    
    // Marcar amenidades
    if (room.amenities) {
        document.getElementById('hasWifi').checked = room.amenities.wifi || false;
        document.getElementById('hasTV').checked = room.amenities.tv || false;
        document.getElementById('hasAC').checked = room.amenities.ac || false;
        document.getElementById('hasPool').checked = room.amenities.pool || false;
        document.getElementById('hasBalcony').checked = room.amenities.balcony || false;
        document.getElementById('hasJacuzzi').checked = room.amenities.jacuzzi || false;
        document.getElementById('hasKitchen').checked = room.amenities.kitchen || false;
        document.getElementById('hasMinibar').checked = room.amenities.minibar || false;
    }
    
    // Marcar vista
    if (room.view) {
        document.querySelector(`input[name="roomView"][value="${room.view}"]`).checked = true;
    }
    
    // Marcar decoración
    if (room.decoration) {
        document.querySelector(`input[name="roomDecoration"][value="${room.decoration}"]`).checked = true;
    }
    
    document.getElementById('roomModal').style.display = 'block';
}

// Cerrar modal de habitación
function closeRoomModal() {
    document.getElementById('roomModal').style.display = 'none';
    editingRoomId = null;
}

// Actualizar opciones de tipo de habitación
function updateRoomTypeOptions() {
    const typeSelect = document.getElementById('roomType');
    typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
    
    roomTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Actualizar filtro de tipos
function updateTypeFilter() {
    const filterSelect = document.getElementById('typeFilter');
    filterSelect.innerHTML = '<option value="">Todos los tipos</option>';
    
    roomTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        filterSelect.appendChild(option);
    });
}

// Filtrar habitaciones por tipo
function filterRooms() {
    const selectedType = document.getElementById('typeFilter').value;
    const roomsGrid = document.getElementById('roomsGrid');
    
    let filteredRooms = rooms;
    if (selectedType) {
        filteredRooms = rooms.filter(room => room.typeId == selectedType);
    }
    
    if (filteredRooms.length === 0) {
        roomsGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
                <p>No se encontraron habitaciones con el filtro seleccionado</p>
            </div>
        `;
        return;
    }
    
    let roomsHTML = '';
    filteredRooms.forEach(room => {
        const type = roomTypes.find(t => t.id === room.typeId);
        const typeName = type ? type.name : 'Sin tipo';
        
        const features = [];
        if (room.bathrooms > 0) features.push(`${room.bathrooms} baño${room.bathrooms > 1 ? 's' : ''}`);
        if (room.beds > 0) features.push(`${room.beds} cama${room.beds > 1 ? 's' : ''}`);
        if (room.capacity > 0) features.push(`${room.capacity} persona${room.capacity > 1 ? 's' : ''}`);
        
        // Agregar amenidades
        if (room.amenities) {
            if (room.amenities.wifi) features.push('WiFi');
            if (room.amenities.tv) features.push('TV');
            if (room.amenities.ac) features.push('A/C');
            if (room.amenities.pool) features.push('Piscina');
            if (room.amenities.balcony) features.push('Balcón');
            if (room.amenities.jacuzzi) features.push('Jacuzzi');
            if (room.amenities.kitchen) features.push('Cocina');
            if (room.amenities.minibar) features.push('Minibar');
        }
        
        roomsHTML += `
            <div class="room-card">
                <h3>${room.name}</h3>
                <p><strong>Tipo:</strong> ${typeName}</p>
                <p>${room.description}</p>
                <div class="price">$${room.price} MXN</div>
                <div class="room-features">
                    ${features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editRoom(${room.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteRoom(${room.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    roomsGrid.innerHTML = roomsHTML;
}

// Guardar habitación
function saveRoom(event) {
    event.preventDefault();
    
    const name = document.getElementById('roomName').value.trim();
    const number = parseInt(document.getElementById('roomNumber').value);
    const typeId = parseInt(document.getElementById('roomType').value);
    const description = document.getElementById('roomDescription').value.trim();
    const price = parseFloat(document.getElementById('roomPrice').value);
    const floor = parseInt(document.getElementById('roomFloor').value) || null;
    const bathrooms = parseInt(document.getElementById('roomBathrooms').value);
    const beds = parseInt(document.getElementById('roomBeds').value);
    const capacity = parseInt(document.getElementById('roomCapacity').value);
    
    // Validaciones
    if (!name || !number || !typeId || !description || isNaN(price) || price < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor completa todos los campos obligatorios correctamente'
        });
        return;
    }
    
    // Verificar si el número de habitación ya existe
    const existingRoom = rooms.find(r => r.number === number && r.id !== editingRoomId);
    if (existingRoom) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Ya existe una habitación con el número ${number}`
        });
        return;
    }
    
    // Recopilar amenidades
    const amenities = {
        wifi: document.getElementById('hasWifi').checked,
        tv: document.getElementById('hasTV').checked,
        ac: document.getElementById('hasAC').checked,
        pool: document.getElementById('hasPool').checked,
        balcony: document.getElementById('hasBalcony').checked,
        jacuzzi: document.getElementById('hasJacuzzi').checked,
        kitchen: document.getElementById('hasKitchen').checked,
        minibar: document.getElementById('hasMinibar').checked
    };
    
    // Obtener vista y decoración
    const view = document.querySelector('input[name="roomView"]:checked').value;
    const decoration = document.querySelector('input[name="roomDecoration"]:checked').value;
    
    // Obtener el tipo de habitación
    const roomTypes = JSON.parse(localStorage.getItem('roomTypes')) || [];
    const selectedType = roomTypes.find(t => t.id === typeId);
    const typeName = selectedType ? selectedType.name.toLowerCase() : 'individual';
    
    if (editingRoomId) {
        // Editar habitación existente
        const roomIndex = rooms.findIndex(r => r.id === editingRoomId);
        if (roomIndex !== -1) {
            rooms[roomIndex] = {
                ...rooms[roomIndex],
                name,
                number,
                typeId,
                type: typeName,
                description,
                price,
                floor,
                bathrooms,
                beds,
                capacity,
                amenities,
                view,
                decoration
            };
        }
    } else {
        // Agregar nueva habitación
        const newRoom = {
            id: Date.now(),
            name,
            number,
            typeId,
            type: typeName,
            description,
            price,
            floor,
            bathrooms,
            beds,
            capacity,
            amenities,
            view,
            decoration,
            status: 'available'
        };
        rooms.push(newRoom);
    }
    
    localStorage.setItem('rooms', JSON.stringify(rooms));
    loadRooms();
    closeRoomModal();
    
    Swal.fire({
        icon: 'success',
        title: editingRoomId ? 'Habitación Actualizada' : 'Habitación Agregada',
        text: `La habitación "${name}" ha sido ${editingRoomId ? 'actualizada' : 'agregada'} exitosamente`
    });
}

// Eliminar habitación
function deleteRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Verificar si hay reservas para esta habitación
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const roomReservations = reservations.filter(r => r.roomId === roomId);
    
    if (roomReservations.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            text: `Hay ${roomReservations.length} reserva(s) para esta habitación. Cancela las reservas primero.`
        });
        return;
    }
    
    Swal.fire({
        title: '¿Eliminar habitación?',
        text: `¿Estás seguro de que quieres eliminar la habitación #${room.number}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            rooms = rooms.filter(r => r.id !== roomId);
            localStorage.setItem('rooms', JSON.stringify(rooms));
            loadRooms();
            
            Swal.fire({
                icon: 'success',
                title: 'Habitación Eliminada',
                text: `La habitación #${room.number} ha sido eliminada exitosamente`
            });
        }
    });
}

// Cerrar sesión
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

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const typeModal = document.getElementById('typeModal');
    const roomModal = document.getElementById('roomModal');
    
    if (event.target === typeModal) {
        closeTypeModal();
    }
    if (event.target === roomModal) {
        closeRoomModal();
    }
} 