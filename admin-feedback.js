// Variables globales
let allFeedbacks = [];
let filteredFeedbacks = [];
let currentFeedbackId = null;

// Función para cargar comentarios
function loadFeedbacks() {
    allFeedbacks = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
    filteredFeedbacks = [...allFeedbacks];
    updateStats();
    displayFeedbacks();
}

// Función para actualizar estadísticas
function updateStats() {
    const totalFeedbacks = allFeedbacks.length;
    const averageRating = totalFeedbacks > 0 
        ? (allFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks).toFixed(1)
        : '0.0';
    const fiveStarCount = allFeedbacks.filter(feedback => feedback.rating === 5).length;
    
    // Contar comentarios de los últimos 7 días
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentFeedbacks = allFeedbacks.filter(feedback => 
        new Date(feedback.date) >= oneWeekAgo
    ).length;

    document.getElementById('totalFeedbacks').textContent = totalFeedbacks;
    document.getElementById('averageRating').textContent = averageRating;
    document.getElementById('fiveStarCount').textContent = fiveStarCount;
    document.getElementById('recentFeedbacks').textContent = recentFeedbacks;
}

// Función para mostrar comentarios
function displayFeedbacks() {
    const container = document.getElementById('feedbacksContainer');
    
    if (filteredFeedbacks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay comentarios para mostrar</p>';
        return;
    }

    // Ordenar por fecha (más recientes primero)
    const sortedFeedbacks = filteredFeedbacks.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedFeedbacks.map(feedback => `
        <div class="feedback-card">
            <div class="feedback-header">
                <div class="feedback-info">
                    <h4>${feedback.name}</h4>
                    <p>${feedback.email} • ${formatDate(feedback.date)}</p>
                </div>
                <div class="feedback-rating">
                    <div class="stars">
                        ${generateStars(feedback.rating)}
                    </div>
                    <span>${feedback.rating}/5</span>
                </div>
            </div>
            <div class="feedback-comment">
                ${feedback.comment.length > 150 
                    ? feedback.comment.substring(0, 150) + '...' 
                    : feedback.comment}
            </div>
            <div class="feedback-actions">
                <button class="btn-view" onclick="viewFeedback(${feedback.id})">
                    <i class="fas fa-eye"></i> Ver completo
                </button>
                <button class="btn-delete" onclick="confirmDelete(${feedback.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// Función para generar estrellas
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'active' : ''}"></i>`;
    }
    return stars;
}

// Función para formatear fecha
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

// Función para filtrar comentarios
function filterFeedbacks() {
    const ratingFilter = document.getElementById('ratingFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredFeedbacks = allFeedbacks.filter(feedback => {
        let passesRating = true;
        let passesDate = true;
        
        // Filtro por calificación
        if (ratingFilter) {
            passesRating = feedback.rating === parseInt(ratingFilter);
        }
        
        // Filtro por fecha
        if (dateFilter) {
            const feedbackDate = new Date(feedback.date);
            const now = new Date();
            
            switch (dateFilter) {
                case 'today':
                    passesDate = feedbackDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    passesDate = feedbackDate >= oneWeekAgo;
                    break;
                case 'month':
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    passesDate = feedbackDate >= oneMonthAgo;
                    break;
            }
        }
        
        return passesRating && passesDate;
    });
    
    displayFeedbacks();
}

// Función para limpiar filtros
function clearFilters() {
    document.getElementById('ratingFilter').value = '';
    document.getElementById('dateFilter').value = '';
    filteredFeedbacks = [...allFeedbacks];
    displayFeedbacks();
}

// Función para ver comentario completo
function viewFeedback(feedbackId) {
    const feedback = allFeedbacks.find(f => f.id === feedbackId);
    if (!feedback) return;
    
    currentFeedbackId = feedbackId;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">${feedback.name}</h4>
            <p style="margin: 0 0 5px 0; color: #666;">${feedback.email}</p>
            <p style="margin: 0 0 15px 0; color: #666;">${formatDate(feedback.date)}</p>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <div class="stars">
                    ${generateStars(feedback.rating)}
                </div>
                <span style="color: #666;">${feedback.rating}/5 estrellas</span>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; line-height: 1.6; color: #333;">${feedback.comment}</p>
        </div>
    `;
    
    document.getElementById('feedbackModal').classList.remove('hidden');
}

// Función para cerrar modal
function closeModal() {
    document.getElementById('feedbackModal').classList.add('hidden');
    currentFeedbackId = null;
}

// Función para confirmar eliminación
function confirmDelete(feedbackId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteFeedbackById(feedbackId);
        }
    });
}

// Función para eliminar comentario
function deleteFeedback() {
    if (currentFeedbackId) {
        deleteFeedbackById(currentFeedbackId);
        closeModal();
    }
}

// Función para eliminar comentario por ID
function deleteFeedbackById(feedbackId) {
    allFeedbacks = allFeedbacks.filter(f => f.id !== feedbackId);
    filteredFeedbacks = filteredFeedbacks.filter(f => f.id !== feedbackId);
    
    localStorage.setItem('customerFeedbacks', JSON.stringify(allFeedbacks));
    
    updateStats();
    displayFeedbacks();
    
    Swal.fire(
        '¡Eliminado!',
        'El comentario ha sido eliminado exitosamente.',
        'success'
    );
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadFeedbacks();
    
    // Cerrar modal al hacer clic fuera de él
    document.getElementById('feedbackModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}); 