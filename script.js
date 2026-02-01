// Configuración de horarios 
const HORARIOS_RESTAURANTE = {
    diasApertura: ['miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'lunes'], // Cerrado martes
    horaApertura: 12, 
    horaCierre: 3,    
    diasReserva: 45   
};

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reservaForm');
    const fechaInput = document.getElementById('fecha');
    const horarioSelect = document.getElementById('horario');
    
    // Inicializar estado 
    actualizarEstadoRestaurante();
    
    // Configurar fecha mínima (hoy) y máxima (45 días)
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + HORARIOS_RESTAURANTE.diasReserva);
    
    fechaInput.min = today.toISOString().split('T')[0];
    fechaInput.max = maxDate.toISOString().split('T')[0];
    fechaInput.value = today.toISOString().split('T')[0];
    
    // Validación de fecha
    fechaInput.addEventListener('change', function() {
        const fechaSeleccionada = new Date(this.value);
        const diaSemana = fechaSeleccionada.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
        
        // Bloquea selección de martes
        if (diaSemana === 'martes') {
            alert('⚠️ El restaurante está cerrado los martes. Por favor, selecciona otro día.');
            this.value = fechaInput.min; 
        }
        actualizarResumen();
    });
    
    // Actualizar resumen en tiempo real
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.addEventListener('change', actualizarResumen);
            input.addEventListener('input', actualizarResumen);
        }
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', actualizarResumen);
    });
    
    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Validar día seleccionado sin martes
            const fechaSeleccionada = new Date(fechaInput.value);
            const diaSemana = fechaSeleccionada.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
            
            if (diaSemana === 'martes') {
                alert('❌ No se pueden hacer reservas los martes. El restaurante está cerrado.');
                fechaInput.focus();
                return;
            }
            
            enviarReservaWhatsApp();
        }
    });
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = '+54' + value;
                } else if (value.length <= 4) {
                    value = '+54 ' + value.slice(0,2) + ' ' + value.slice(2);
                } else if (value.length <= 8) {
                    value = '+54 ' + value.slice(0,2) + ' ' + value.slice(2,5) + ' ' + value.slice(5);
                } else {
                    value = '+54 ' + value.slice(0,2) + ' ' + value.slice(2,5) + ' ' + value.slice(5,8) + ' ' + value.slice(8,12);
                }
                e.target.value = value;
            }
        });
    }
    actualizarResumen();
    setInterval(actualizarEstadoRestaurante, 60000);
});
function actualizarEstadoRestaurante() {
    const ahora = new Date();
    const diaActual = ahora.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
    const horaActual = ahora.getHours();
    const minutosActual = ahora.getMinutes();
    
    const estadoElemento = document.getElementById('estadoRestaurante');
    const estadoBadge = document.getElementById('estadoBadge');
    
    // Verificar si es martes (día cerrado)
    if (diaActual === 'martes') {
        estadoElemento.innerHTML = `
            <div class="alert alert-danger d-inline-flex align-items-center py-2 px-3 rounded-pill">
                <i class="bi bi-x-circle-fill me-2"></i>
                <strong>HOY CERRADO</strong> - Abrimos mañana miércoles a las 12:00
            </div>
        `;
        estadoBadge.textContent = 'CERRADO';
        estadoBadge.style.backgroundColor = 'rgba(220, 53, 69, 0.4)';
        return false;
    }
    
    // Verificar si está dentro de los días de apertura
    if (HORARIOS_RESTAURANTE.diasApertura.includes(diaActual)) {
        // Para horario nocturno (después de medianoche hasta las 3 AM)
        if (horaActual >= 0 && horaActual < 3) {
            // Está abierto después de medianoche
            const minutosRestantes = (2 - horaActual) * 60 + (60 - minutosActual);
            const horasRestantes = Math.floor(minutosRestantes / 60);
            const minsRestantes = minutosRestantes % 60;
            
            estadoElemento.innerHTML = `
                <div class="alert alert-success d-inline-flex align-items-center py-2 px-3 rounded-pill">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>ABIERTO AHORA</strong> - Cerramos a las 03:00 AM (${horasRestantes}h ${minsRestantes}m)
                </div>
            `;
            estadoBadge.textContent = 'ABIERTO';
            estadoBadge.style.backgroundColor = 'rgba(25, 135, 84, 0.4)';
            return true;
        }
        // Para horario diurno (de 12:00 PM en adelante)
        else if (horaActual >= HORARIOS_RESTAURANTE.horaApertura) {
            // Calcular tiempo hasta cierre (03:00 AM del día siguiente)
            const minutosRestantes = (26 - horaActual) * 60 + (60 - minutosActual);
            const horasRestantes = Math.floor(minutosRestantes / 60);
            const minsRestantes = minutosRestantes % 60;
            
            estadoElemento.innerHTML = `
                <div class="alert alert-success d-inline-flex align-items-center py-2 px-3 rounded-pill">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>ABIERTO AHORA</strong> - Cerramos a las 03:00 AM (${horasRestantes}h ${minsRestantes}m)
                </div>
            `;
            estadoBadge.textContent = 'ABIERTO';
            estadoBadge.style.backgroundColor = 'rgba(25, 135, 84, 0.4)';
            return true;
        } else {
            // Está cerrado pero abrirá hoy
            const minutosParaAbrir = (HORARIOS_RESTAURANTE.horaApertura - horaActual - 1) * 60 + (60 - minutosActual);
            const horasParaAbrir = Math.floor(minutosParaAbrir / 60);
            const minsParaAbrir = minutosParaAbrir % 60;
            
            estadoElemento.innerHTML = `
                <div class="alert alert-warning d-inline-flex align-items-center py-2 px-3 rounded-pill">
                    <i class="bi bi-clock-history me-2"></i>
                    <strong>CERRADO AHORA</strong> - Abrimos a las 12:00 (${horasParaAbrir}h ${minsParaAbrir}m)
                </div>
            `;
            estadoBadge.textContent = 'CERRADO';
            estadoBadge.style.backgroundColor = 'rgba(255, 193, 7, 0.4)';
            return false;
        }
    }
    
    // Por si acaso (no debería llegar aquí)
    estadoBadge.textContent = 'CERRADO';
    estadoBadge.style.backgroundColor = 'rgba(108, 117, 125, 0.4)';
    return false;
}

// Actualizar el resumen en tiempo real
function actualizarResumen() {
    const form = document.getElementById('reservaForm');
    const fecha = document.getElementById('fecha').value;
    if (fecha) {
        const dateObj = new Date(fecha);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('fechaResumen').textContent = 
            dateObj.toLocaleDateString('es-AR', options);
    } else {
        document.getElementById('fechaResumen').textContent = '-';
    }
    const horario = document.getElementById('horario').value;
    document.getElementById('horaResumen').textContent = horario ? horario + ' hs' : '-';
    const comensales = document.getElementById('comensales').value;
    if (comensales) {
        const texto = comensales === '1' ? '1 persona' : `${comensales} personas`;
        document.getElementById('comensalesResumen').textContent = texto;
    } else {
        document.getElementById('comensalesResumen').textContent = '-';
    }
    
    // Ocasiones seleccionadas
    const ocasiones = [];
    form.querySelectorAll('input[name="ocasion"]:checked').forEach(cb => {
        ocasiones.push(cb.value);
    });
    document.getElementById('ocasionResumen').textContent = 
        ocasiones.length > 0 ? ocasiones.join(', ') : '-';
}

// Validar formulario
function validateForm() {
    const form = document.getElementById('reservaForm');
    let isValid = true;
    const required = form.querySelectorAll('[required]');
    const errorText = document.getElementById('errorText');
    const errorAlert = document.getElementById('errorAlert');
    
    // Limpiar errores anteriores
    required.forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    // Verificar campos obligatorios
    required.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    // Verificar horario seleccionado
    const horario = document.getElementById('horario').value;
    if (!horario || horario === '') {
        document.getElementById('horario').classList.add('is-invalid');
        isValid = false;
    }
    
    // Mostrar u ocultar error
    if (!isValid) {
        errorText.textContent = 'Por favor, completa todos los campos obligatorios marcados con *.';
        errorAlert.classList.remove('d-none');
        
        // Desplazar hacia el primer error
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
        }
        
        // Ocultar error después de 5 segundos
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    } else {
        errorAlert.classList.add('d-none');
    }
    
    return isValid;
}
function enviarReservaWhatsApp() {
    const form = document.getElementById('reservaForm');
    const formData = new FormData(form);
    const ocasiones = [];
    form.querySelectorAll('input[name="ocasion"]:checked').forEach(cb => {
        ocasiones.push(cb.value);
    });
    
    // Formatear fecha
    const fecha = formData.get('fecha');
    const fechaObj = new Date(fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Crear mensaje estructurado 
    let mensaje = `🍽️ *RESERVA - LA ROKA PUB & CAFÉ CONCERT* 🍽️\n\n`;
    
    mensaje += `*👤 Información Personal*\n`;
    mensaje += `• Nombre: ${formData.get('nombre')}\n`;
    mensaje += `• Comensales: ${formData.get('comensales')} personas\n`;
    mensaje += `• Teléfono: ${formData.get('telefono')}\n`;
    
    if (formData.get('email')) {
        mensaje += `• Email: ${formData.get('email')}\n`;
    }
    
    mensaje += `\n*📅 Fecha y Hora*\n`;
    mensaje += `• Fecha: ${fechaFormateada}\n`;
    mensaje += `• Hora: ${formData.get('horario')} hs\n`;
    
    if (ocasiones.length > 0) {
        mensaje += `• Ocasión: ${ocasiones.join(', ')}\n`;
    }
    
    if (formData.get('necesidades')) {
        mensaje += `\n*⚠️ Necesidades Especiales*\n`;
        mensaje += `${formData.get('necesidades')}\n`;
    }
    
    mensaje += `\n--------------------------------\n`;
    mensaje += `Enviado desde formulario web\n`;
    mensaje += `📅 ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}`;
    
    
    const phoneNumber = '2974219373';
    
    // Crear URL de WhatsApp 
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(whatsappURL, '_blank');
    
    // Mostrar mensaje de confirmación
    alert('✅ Reserva enviada correctamente. Se abrirá WhatsApp para que puedas confirmar.');
  