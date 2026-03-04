// Variables globales
let serviciosData = [];
let categoriaSeleccionada = 'Todas las categorías';

// Cargar datos cuando la página esté lista
document.addEventListener('DOMContentIZED', function() {
    cargarDatos();
    configurarEventListeners();
});

function cargarDatos() {
    // Aquí deberías cargar tus datos desde la carpeta data
    // Por ahora usaremos los datos que ya están en el HTML
    console.log('Datos cargados');
}

function configurarEventListeners() {
    // Botones de cerrar
    const closeButtons = document.querySelectorAll('.close-button, [data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', cerrarModal);
    });
    
    // Selector de categorías
    const categoriaSelect = document.querySelector('select[name="categoria"], .categoria-select');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', filtrarPorCategoria);
    }
    
    // Buscador
    const buscador = document.querySelector('input[type="text"][placeholder*="Buscar"], .buscador');
    if (buscador) {
        buscador.addEventListener('input', filtrarServicios);
    }
}

function cerrarModal() {
    const modal = document.querySelector('.modal.show, .modal.active, [class*="modal"]');
    if (modal) {
        modal.classList.remove('show', 'active');
        modal.style.display = 'none';
    }
    
    // También cerrar cualquier detalle abierto
    const detalles = document.querySelectorAll('.detalle-servicio.active, .servicio-detalle.show');
    detalles.forEach(detalle => {
        detalle.classList.remove('active', 'show');
        detalle.style.display = 'none';
    });
}

function filtrarPorCategoria(event) {
    categoriaSeleccionada = event.target.value;
    filtrarServicios();
}

function filtrarServicios() {
    const textoBusqueda = document.querySelector('input[type="text"][placeholder*="Buscar"], .buscador')?.value?.toLowerCase() || '';
    const filas = document.querySelectorAll('table tbody tr, .servicio-fila');
    
    filas.forEach(fila => {
        const servicioTexto = fila.textContent.toLowerCase();
        const categoriaFila = fila.querySelector('.categoria')?.textContent || '';
        
        // Verificar filtros
        const coincideBusqueda = textoBusqueda === '' || servicioTexto.includes(textoBusqueda);
        const coincideCategoria = categoriaSeleccionada === 'Todas las categorías' || 
                                 categoriaFila.includes(categoriaSeleccionada);
        
        // Mostrar u ocultar
        if (coincideBusqueda && coincideCategoria) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// Función para mostrar detalles de servicio
function mostrarDetalleServicio(servicioId) {
    const detalle = document.getElementById(`detalle-${servicioId}`);
    if (detalle) {
        detalle.classList.add('active', 'show');
        detalle.style.display = 'block';
    }
}

// Cerrar con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModal();
    }
});
