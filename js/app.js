class ReportesApp {
    constructor() {
        this.servicios = [];
        this.resultadosActuales = [];
        this.crud = null;
        this.init();
    }

    async init() {
        await this.cargarServicios();
        this.initEventListeners();
        this.cargarTabla();
        this.actualizarEstadisticas();
        
        this.inicializarCRUD();
        
        if ($('#servicioCategoria').length) {
            $('#servicioCategoria').select2({theme: 'classic', width: '100%'});
        }
        if ($('#filtrarCategoria').length) {
            $('#filtrarCategoria').select2({theme: 'classic', width: '100%'});
        }
    }
    
    inicializarCRUD() {
        try {
            if (typeof CRUDScripts !== 'undefined') {
                this.crud = new CRUDScripts(this);
                window.crud = this.crud;
                console.log('✅ CRUD inicializado correctamente');
            } else {
                setTimeout(() => this.inicializarCRUD(), 500);
            }
        } catch (error) {
            console.error('Error al inicializar CRUD:', error);
        }
    }
    
    async cargarServicios() {
        try {
            // Intentar cargar desde servicios.js primero
            if (typeof servicios !== 'undefined' && servicios.length > 0) {
                this.servicios = JSON.parse(JSON.stringify(servicios));
                console.log('✅ Servicios cargados desde servicios.js:', this.servicios.length);
            } 
            // Si no, intentar desde datosRespaldo
            else if (typeof datosRespaldo !== 'undefined' && datosRespaldo.length > 0) {
                this.servicios = JSON.parse(JSON.stringify(datosRespaldo));
                console.log('✅ Servicios cargados desde datosRespaldo:', this.servicios.length);
            }
            // Última opción: fetch a servicios.json
            else {
                const response = await fetch('data/servicios.json');
                if (!response.ok) throw new Error('No se pudo cargar el archivo de servicios');
                this.servicios = await response.json();
                console.log('✅ Servicios cargados desde servicios.json:', this.servicios.length);
            }
            
            // Guardar en localStorage como respaldo
            this.guardarServicios();
            
            // Actualizar contador
            document.getElementById('totalServicios').textContent = this.servicios.length;
            
        } catch (error) {
            console.error('Error cargando servicios:', error);
            this.servicios = [];
            document.getElementById('totalServicios').textContent = '0';
            this.mostrarNotificacion('Error cargando servicios', 'error');
        }
    }
    
    guardarServicios() {
        localStorage.setItem('serviciosData', JSON.stringify(this.servicios));
        localStorage.setItem('ultimaActualizacion', new Date().toLocaleString());
        this.actualizarEstadisticas();
    }
    
    actualizarEstadisticas() {
        const fecha = localStorage.getItem('ultimaActualizacion') || 'Hoy';
        document.getElementById('ultimaActualizacion').textContent = fecha;
    }
    
    initEventListeners() {
        const buscarInput = document.getElementById('buscarServicio');
        if (buscarInput) {
            buscarInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.buscarServicios();
            });
        }

        // Botón de búsqueda
        const btnSearch = document.querySelector('.btn-search');
        if (btnSearch) {
            btnSearch.addEventListener('click', (e) => {
                e.preventDefault();
                this.buscarServicios();
            });
        }

        const filtrarTabla = document.getElementById('filtrarTabla');
        if (filtrarTabla) {
            filtrarTabla.addEventListener('input', (e) => {
                this.cargarTabla(e.target.value);
            });
        }

        const filtrarCategoria = document.getElementById('filtrarCategoria');
        if (filtrarCategoria) {
            filtrarCategoria.addEventListener('change', (e) => {
                this.cargarTabla();
            });
        }

        ['scriptFalla', 'scriptNormalidad', 'scriptIntermitencia'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    const countElement = document.getElementById(`count${id.replace('script', '')}`);
                    if (countElement) {
                        countElement.textContent = `${e.target.value.length} caracteres`;
                    }
                });
            }
        });

        window.addEventListener('scroll', () => {
            const btnTop = document.getElementById('btnTop');
            if (btnTop) {
                if (window.scrollY > 300) {
                    btnTop.classList.remove('hidden');
                } else {
                    btnTop.classList.add('hidden');
                }
            }
        });
    }
    
    buscarServicios() {
        const busqueda = document.getElementById('buscarServicio').value.trim();
        const resultadosSection = document.getElementById('resultadosSection');
        const noEncontrado = document.getElementById('noEncontrado');

        const searchBtn = document.querySelector('.btn-search');
        let originalText = '';
        if (searchBtn) {
            originalText = searchBtn.innerHTML;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            searchBtn.disabled = true;
        }

        if (resultadosSection) resultadosSection.classList.add('hidden');
        if (noEncontrado) noEncontrado.classList.add('hidden');

        setTimeout(() => {
            if (!busqueda) {
                this.mostrarNotificacion('Por favor, ingresa un término para buscar', 'info');
                if (searchBtn) {
                    searchBtn.innerHTML = originalText;
                    searchBtn.disabled = false;
                }
                return;
            }

            this.resultadosActuales = this.servicios.filter(serv => 
                serv.servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
                (serv.falla && serv.falla.toLowerCase().includes(busqueda.toLowerCase())) ||
                (serv.normalidad && serv.normalidad.toLowerCase().includes(busqueda.toLowerCase())) ||
                (serv.intermitencia && serv.intermitencia.toLowerCase().includes(busqueda.toLowerCase()))
            );

            if (this.resultadosActuales.length > 0) {
                this.mostrarResultados(this.resultadosActuales, busqueda);
                if (resultadosSection) {
                    resultadosSection.classList.remove('hidden');
                    resultadosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                this.mostrarNotificacion(`Encontrados ${this.resultadosActuales.length} servicios`, 'success');
            } else {
                if (noEncontrado) noEncontrado.classList.remove('hidden');
                this.mostrarNotificacion('No se encontraron servicios con ese nombre', 'info');
            }

            if (searchBtn) {
                searchBtn.innerHTML = originalText;
                searchBtn.disabled = false;
            }
        }, 300);
    }
    
    mostrarResultados(servicios, busqueda = '') {
        const container = document.getElementById('resultadosContainer');
        const contador = document.getElementById('contadorResultados');
        
        if (container) container.innerHTML = '';
        if (contador) contador.textContent = `${servicios.length} servicio${servicios.length !== 1 ? 's' : ''} encontrado${servicios.length !== 1 ? 's' : ''}`;

        servicios.forEach((servicio, index) => {
            const card = this.crearTarjetaResultado(servicio, index, busqueda);
            if (container) container.appendChild(card);
        });
    }
    
    crearTarjetaResultado(servicio, index, busqueda) {
        const div = document.createElement('div');
        div.className = 'result-card fade-in';
        div.style.animationDelay = `${index * 0.05}s`;
        
        const categoria = servicio.categoria || 'general';
        const categoriaTexto = this.obtenerTextoCategoria(categoria);
        
        div.innerHTML = `
            <div class="result-header">
                <div>
                    <h3 class="result-title">${servicio.servicio}</h3>
                    <span class="result-category">${categoriaTexto}</span>
                </div>
                <div class="script-actions">
                    <button class="btn btn-copy" onclick="app.copiarServicio('${this.escapeHtml(servicio.servicio)}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-info" onclick="app.mostrarDetallesCompletos('${this.escapeHtml(servicio.servicio)}')">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            
            <div class="script-grid">
                <div class="script-card script-card-falla">
                    <div class="script-card-header">
                        <h4 class="script-card-title">
                            <span class="status-dot dot-falla"></span> Falla
                        </h4>
                        <button class="btn btn-clear" onclick="app.copiarTexto('${this.escapeHtml(servicio.falla)}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="script-content">${this.resaltarTexto(servicio.falla, busqueda)}</div>
                </div>
                
                <div class="script-card script-card-normalidad">
                    <div class="script-card-header">
                        <h4 class="script-card-title">
                            <span class="status-dot dot-normalidad"></span> Normalidad
                        </h4>
                        <button class="btn btn-clear" onclick="app.copiarTexto('${this.escapeHtml(servicio.normalidad)}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="script-content">${this.resaltarTexto(servicio.normalidad, busqueda)}</div>
                </div>
                
                <div class="script-card script-card-intermitencia">
                    <div class="script-card-header">
                        <h4 class="script-card-title">
                            <span class="status-dot dot-intermitencia"></span> Intermitencia
                        </h4>
                        <button class="btn btn-clear" onclick="app.copiarTexto('${this.escapeHtml(servicio.intermitencia)}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="script-content">${this.resaltarTexto(servicio.intermitencia, busqueda)}</div>
                </div>
            </div>
        `;
        
        return div;
    }
    
    cargarTabla(filtro = '') {
        const tbody = document.getElementById('tablaServicios');
        const contador = document.getElementById('contadorTabla');
        
        if (!tbody || !contador) return;
        
        let serviciosFiltrados = this.servicios;
        
        if (filtro) {
            serviciosFiltrados = serviciosFiltrados.filter(serv => 
                serv.servicio.toLowerCase().includes(filtro.toLowerCase()) ||
                (serv.falla && serv.falla.toLowerCase().includes(filtro.toLowerCase())) ||
                (serv.normalidad && serv.normalidad.toLowerCase().includes(filtro.toLowerCase())) ||
                (serv.intermitencia && serv.intermitencia.toLowerCase().includes(filtro.toLowerCase()))
            );
        }
        
        const categoriaFiltro = document.getElementById('filtrarCategoria');
        if (categoriaFiltro && categoriaFiltro.value) {
            serviciosFiltrados = serviciosFiltrados.filter(serv => 
                (serv.categoria || 'general') === categoriaFiltro.value
            );
        }
        
        tbody.innerHTML = '';
        contador.textContent = serviciosFiltrados.length;
        
        serviciosFiltrados.forEach(servicio => {
            const fila = this.crearFilaTabla(servicio);
            tbody.appendChild(fila);
        });
    }
    
    crearFilaTabla(servicio) {
        const tr = document.createElement('tr');
        tr.className = 'table-row';
        tr.onclick = () => this.buscarServicioDesdeTabla(servicio.servicio);
        
        const categoria = servicio.categoria || 'general';
        const categoriaTexto = this.obtenerTextoCategoria(categoria);
        
        tr.innerHTML = `
            <td>
                <div class="font-semibold text-primary">${servicio.servicio}</div>
                <div class="text-xs text-secondary mt-1">Haz clic para ver detalles</div>
            </td>
            <td>
                <span class="category-badge">${categoriaTexto}</span>
            </td>
            <td>
                <div class="max-h-20 overflow-y-auto text-sm">${this.crearResumen(servicio.falla)}</div>
            </td>
            <td>
                <div class="max-h-20 overflow-y-auto text-sm">${this.crearResumen(servicio.normalidad)}</div>
            </td>
            <td>
                <div class="max-h-20 overflow-y-auto text-sm">${this.crearResumen(servicio.intermitencia)}</div>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn btn-copy" onclick="event.stopPropagation(); app.copiarServicio('${this.escapeHtml(servicio.servicio)}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-info" onclick="event.stopPropagation(); app.mostrarDetallesCompletos('${this.escapeHtml(servicio.servicio)}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        return tr;
    }
    
    escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, function(match) {
            if (match === '&') return '&amp;';
            if (match === '<') return '&lt;';
            if (match === '>') return '&gt;';
            if (match === '"') return '&quot;';
            if (match === "'") return '&#39;';
            return match;
        });
    }
    
    resaltarTexto(texto, busqueda) {
        if (!texto) return '';
        if (!busqueda) return texto;
        try {
            const regex = new RegExp(`(${busqueda.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
            return texto.toString().replace(regex, '<mark>$1</mark>');
        } catch (e) {
            return texto;
        }
    }
    
    crearResumen(texto, maxLength = 100) {
        if (!texto || texto.trim() === '') return '<span class="text-muted">N/A</span>';
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength) + '...';
    }
    
    obtenerTextoCategoria(categoria) {
        const categorias = {
            'telecomunicaciones': 'Telecomunicaciones',
            'bancos': 'Bancos',
            'servicios_publicos': 'Servicios Públicos',
            'entretenimiento': 'Entretenimiento',
            'seguros': 'Seguros',
            'general': 'General'
        };
        return categorias[categoria] || 'General';
    }
    
    buscarServicioDesdeTabla(nombreServicio) {
        const buscarInput = document.getElementById('buscarServicio');
        if (buscarInput) {
            buscarInput.value = nombreServicio;
            this.buscarServicios();
        }
    }
    
    mostrarTodos() {
        const buscarInput = document.getElementById('buscarServicio');
        if (buscarInput) buscarInput.value = '';
        
        this.resultadosActuales = [...this.servicios];
        this.mostrarResultados(this.resultadosActuales);
        
        const resultadosSection = document.getElementById('resultadosSection');
        if (resultadosSection) {
            resultadosSection.classList.remove('hidden');
            resultadosSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.mostrarNotificacion(`Mostrando todos los ${this.servicios.length} servicios`, 'info');
    }
    
    limpiarBusqueda() {
        const buscarInput = document.getElementById('buscarServicio');
        if (buscarInput) buscarInput.value = '';
        
        const resultadosSection = document.getElementById('resultadosSection');
        if (resultadosSection) resultadosSection.classList.add('hidden');
        
        const noEncontrado = document.getElementById('noEncontrado');
        if (noEncontrado) noEncontrado.classList.add('hidden');
        
        this.resultadosActuales = [];
        
        if (buscarInput) buscarInput.focus();
    }
    
    copiarTexto(texto) {
        if (!texto) return;
        navigator.clipboard.writeText(texto).then(() => {
            this.mostrarNotificacion('Texto copiado al portapapeles', 'success');
        }).catch(() => {
            alert('Texto copiado (usar Ctrl+C):\n\n' + texto);
        });
    }
    
    copiarServicio(nombreServicio) {
        if (!nombreServicio) return;
        navigator.clipboard.writeText(nombreServicio).then(() => {
            this.mostrarNotificacion('Servicio copiado al portapapeles', 'success');
        });
    }
    
    copiarResultados() {
        if (this.resultadosActuales.length === 0) {
            this.mostrarNotificacion('No hay resultados para copiar', 'warning');
            return;
        }
        
        let texto = `RESULTADOS DE BÚSQUEDA (${this.resultadosActuales.length} servicios)\n\n`;
        this.resultadosActuales.forEach((serv, index) => {
            texto += `${index + 1}. ${serv.servicio}\n`;
            texto += `   FALLA: ${serv.falla || 'N/A'}\n`;
            texto += `   NORMALIDAD: ${serv.normalidad || 'N/A'}\n`;
            texto += `   INTERMITENCIA: ${serv.intermitencia || 'N/A'}\n\n`;
        });
        
        navigator.clipboard.writeText(texto).then(() => {
            this.mostrarNotificacion('Resultados copiados al portapapeles', 'success');
        });
    }
    
    exportarResultados() {
        if (this.resultadosActuales.length === 0) {
            this.mostrarNotificacion('No hay resultados para exportar', 'warning');
            return;
        }
        
        let csv = 'Servicio,Categoria,Falla,Normalidad,Intermitencia\n';
        this.resultadosActuales.forEach(serv => {
            const falla = (serv.falla || '').replace(/"/g, '""');
            const normalidad = (serv.normalidad || '').replace(/"/g, '""');
            const intermitencia = (serv.intermitencia || '').replace(/"/g, '""');
            csv += `"${serv.servicio}","${serv.categoria || 'general'}","${falla}","${normalidad}","${intermitencia}"\n`;
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reportes-servicios-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.mostrarNotificacion('Resultados exportados como CSV', 'success');
    }
    
    mostrarNotificacion(mensaje, tipo = 'success') {
        const tipos = {
            success: { icon: 'check-circle', color: '#10b981' },
            warning: { icon: 'exclamation-triangle', color: '#f59e0b' },
            error: { icon: 'times-circle', color: '#ef4444' },
            info: { icon: 'info-circle', color: '#3b82f6' }
        };
        
        const tipoInfo = tipos[tipo] || tipos.info;
        
        const notificacion = document.createElement('div');
        notificacion.className = 'notification';
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            border-left: 4px solid ${tipoInfo.color};
            animation: slideIn 0.3s ease;
        `;
        
        notificacion.innerHTML = `
            <i class="fas fa-${tipoInfo.icon}" style="color: ${tipoInfo.color}; font-size: 20px;"></i>
            <span>${mensaje}</span>
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
        
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    mostrarDetallesCompletos(nombreServicio) {
        const servicio = this.servicios.find(s => s.servicio === nombreServicio);
        if (!servicio) return;

        const modal = document.getElementById('detallesModal');
        const modalTitulo = document.getElementById('modalTitulo');
        const modalBody = document.getElementById('modalBody');
        const btnCopiar = document.getElementById('btnCopiarModal');

        if (!modal || !modalTitulo || !modalBody || !btnCopiar) return;

        modalTitulo.textContent = servicio.servicio;
        
        modalBody.innerHTML = `
            <div class="modal-grid">
                <div class="modal-section">
                    <h4><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Falla</h4>
                    <div class="modal-script">${this.escapeHtml(servicio.falla || 'No especificado').replace(/\n/g, '<br>')}</div>
                </div>
                <div class="modal-section">
                    <h4><i class="fas fa-check-circle" style="color: #10b981;"></i> Normalidad</h4>
                    <div class="modal-script">${this.escapeHtml(servicio.normalidad || 'No especificado').replace(/\n/g, '<br>')}</div>
                </div>
                <div class="modal-section">
                    <h4><i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i> Intermitencia</h4>
                    <div class="modal-script">${this.escapeHtml(servicio.intermitencia || 'No especificado').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;

        btnCopiar.onclick = () => {
            const texto = `
SERVICIO: ${servicio.servicio}

FALLA:
${servicio.falla || 'No especificado'}

NORMALIDAD:
${servicio.normalidad || 'No especificado'}

INTERMITENCIA:
${servicio.intermitencia || 'No especificado'}
            `;
            this.copiarTexto(texto.trim());
        };

        modal.classList.remove('hidden');
    }
    
    cerrarModal() {
        const modal = document.getElementById('detallesModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Inicializar la aplicación
const app = new ReportesApp();
window.app = app;

// Funciones globales
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.toggle('hidden');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarModal() {
    if (window.app) {
        window.app.cerrarModal();
    }
}

function mostrarFormularioNuevo() {
    if (window.crud) {
        window.crud.mostrarFormularioNuevo();
    } else {
        setTimeout(() => {
            if (window.crud) {
                window.crud.mostrarFormularioNuevo();
            } else {
                alert('Error: El sistema no está listo. Recarga la página.');
            }
        }, 500);
    }
}

function buscarServicios() {
    if (window.app) {
        window.app.buscarServicios();
    }
}

function limpiarBusqueda() {
    if (window.app) {
        window.app.limpiarBusqueda();
    }
}

function mostrarTodos() {
    if (window.app) {
        window.app.mostrarTodos();
    }
}

function copiarResultados() {
    if (window.app) {
        window.app.copiarResultados();
    }
}

function exportarResultados() {
    if (window.app) {
        window.app.exportarResultados();
    }
}
