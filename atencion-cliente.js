// Variables globales
let selectedRating = 0;

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

// Función para mostrar pantalla de carga
function showLoadingScreen() {
    document.getElementById('feedbackForm').classList.add('hidden');
    document.getElementById('loadingScreen').classList.remove('hidden');
}

// Función para ocultar pantalla de carga
function hideLoadingScreen() {
    document.getElementById('loadingForm').classList.remove('hidden');
    document.getElementById('loadingScreen').classList.add('hidden');
}

// Función para manejar el sistema de calificación con estrellas
function initializeRating() {
    const stars = document.querySelectorAll('.stars i');
    const ratingText = document.getElementById('rating-text');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.getAttribute('data-rating');
            highlightStars(rating);
            updateRatingText(rating);
        });
        
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            selectedRating = parseInt(rating);
            highlightStars(rating);
            updateRatingText(rating);
        });
    });
    
    // Evento para cuando el mouse sale del contenedor de estrellas
    document.querySelector('.stars').addEventListener('mouseout', function() {
        if (selectedRating === 0) {
            resetStars();
            ratingText.textContent = 'Selecciona una calificación';
        } else {
            highlightStars(selectedRating);
            updateRatingText(selectedRating);
        }
    });
}

// Función para resaltar estrellas
function highlightStars(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Función para resetear estrellas
function resetStars() {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

// Función para actualizar el texto de calificación
function updateRatingText(rating) {
    const ratingText = document.getElementById('rating-text');
    const ratings = {
        1: 'Muy malo',
        2: 'Malo',
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
    };
    ratingText.textContent = ratings[rating] || 'Selecciona una calificación';
}

// Función para enviar comentario
function submitFeedback() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const comment = document.getElementById('customerComment').value.trim();

    // Validaciones
    if (!name || !email || !comment) {
        showAlert('feedback', 'Por favor completa todos los campos', 'error');
        return;
    }

    if (selectedRating === 0) {
        showAlert('feedback', 'Por favor selecciona una calificación', 'error');
        return;
    }

    if (comment.length < 10) {
        showAlert('feedback', 'El comentario debe tener al menos 10 caracteres', 'error');
        return;
    }

    // Crear objeto de feedback
    const feedback = {
        id: Date.now(),
        name: name,
        email: email,
        rating: selectedRating,
        comment: comment,
        date: new Date().toISOString(),
        status: 'active'
    };

    // Guardar en localStorage
    const feedbacks = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('customerFeedbacks', JSON.stringify(feedbacks));

    // Mostrar mensaje de éxito
    showAlert('feedback', '¡Gracias por tu comentario! Tu opinión es muy importante para nosotros.', 'success');
    
    // Mostrar pantalla de carga
    showLoadingScreen();
    
    // Limpiar formulario después de 2 segundos
    setTimeout(() => {
        document.getElementById('customerName').value = '';
        document.getElementById('customerEmail').value = '';
        document.getElementById('customerComment').value = '';
        selectedRating = 0;
        resetStars();
        document.getElementById('rating-text').textContent = 'Selecciona una calificación';
        
        // Ocultar pantalla de carga y mostrar formulario
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('feedbackForm').classList.remove('hidden');
        
        // Recargar comentarios existentes
        loadExistingFeedbacks();
    }, 2000);
}

// Event listeners para envío con Enter
document.addEventListener('DOMContentLoaded', function() {
    initializeRating();
    loadExistingFeedbacks();
    
    const customerName = document.getElementById('customerName');
    const customerEmail = document.getElementById('customerEmail');
    const customerComment = document.getElementById('customerComment');
    
    if (customerName) {
        customerName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                customerEmail.focus();
            }
        });
    }

    if (customerEmail) {
        customerEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                customerComment.focus();
            }
        });
    }

    if (customerComment) {
        customerComment.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                submitFeedback();
            }
        });
    }
});

// Función para cargar comentarios existentes
function loadExistingFeedbacks() {
    const feedbacksList = document.getElementById('feedbacksList');
    if (!feedbacksList) return;
    
    const feedbacks = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
    
    if (feedbacks.length === 0) {
        feedbacksList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-comment-slash" style="font-size: 3rem; margin-bottom: 1rem; color: #ddd;"></i>
                <p>No hay comentarios aún. ¡Sé el primero en compartir tu experiencia!</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedFeedbacks = feedbacks.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    feedbacksList.innerHTML = sortedFeedbacks.map(feedback => `
        <div class="feedback-card-user">
            <div class="feedback-header-user">
                <div class="feedback-info-user">
                    <h4>${feedback.name}</h4>
                    <p>${formatDate(feedback.date)}</p>
                </div>
                <div class="feedback-rating-user">
                    <div class="stars">
                        ${generateStars(feedback.rating)}
                    </div>
                    <span>${feedback.rating}/5</span>
                </div>
            </div>
            <div class="feedback-comment-user">
                ${feedback.comment}
            </div>
        </div>
    `).join('');
}

// Función para generar estrellas (reutilizada)
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'active' : ''}"></i>`;
    }
    return stars;
}

// Función para formatear fecha (reutilizada)
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