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
            } else {
                setTimeout(() => this.inicializarCRUD(), 500);
            }
        } catch (error) {
            console.error('Error al inicializar CRUD:', error);
        }
    }
    
    async cargarServicios() {
        try {
            const saved = localStorage.getItem('serviciosData');
            if (saved) {
                this.servicios = JSON.parse(saved);
            } else {
                const response = await fetch('data/servicios.json');
                if (!response.ok) throw new Error('No se pudo cargar el archivo de servicios');
                this.servicios = await response.json();
                this.guardarServicios();
            }
            document.getElementById('totalServicios').textContent = this.servicios.length;
        } catch (error) {
            this.servicios = datosRespaldo || [];
            document.getElementById('totalServicios').textContent = this.servicios.length;
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
        
        let fallas = 0;
        let normalidad = 0;
        let intermitencias = 0;
        
        this.servicios.forEach(serv => {
            if (serv.falla && serv.falla.trim()) fallas++;
            if (serv.normalidad && serv.normalidad.trim()) normalidad++;
            if (serv.intermitencia && serv.intermitencia.trim()) intermitencias++;
        });
        
        const contadorFallas = document.getElementById('contadorFallas');
        const contadorNormalidad = document.getElementById('contadorNormalidad');
        const contadorIntermitencias = document.getElementById('contadorIntermitencias');
        
        if (contadorFallas) contadorFallas.textContent = fallas;
        if (contadorNormalidad) contadorNormalidad.textContent = normalidad;
        if (contadorIntermitencias) contadorIntermitencias.textContent = intermitencias;
    }
    
    initEventListeners() {
        const buscarInput = document.getElementById('buscarServicio');
        if (buscarInput) {
            buscarInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.buscarServicios();
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
        if (searchBtn) {
            const originalText = searchBtn.innerHTML;
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/'/g, "\\'");
    }
    
    resaltarTexto(texto, busqueda) {
        if (!busqueda || !texto) return texto;
        const regex = new RegExp(`(${busqueda.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        return texto.toString().replace(regex, '<mark>$1</mark>');
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
            csv += `"${serv.servicio}","${serv.categoria || 'general'}","${serv.falla || ''}","${serv.normalidad || ''}","${serv.intermitencia || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
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
                    <h4><i class="fas fa-exclamation-triangle text-danger"></i> Falla</h4>
                    <div class="modal-script">${servicio.falla || 'No especificado'}</div>
                </div>
                <div class="modal-section">
                    <h4><i class="fas fa-check-circle text-success"></i> Normalidad</h4>
                    <div class="modal-script">${servicio.normalidad || 'No especificado'}</div>
                </div>
                <div class="modal-section">
                    <h4><i class="fas fa-exclamation-circle text-warning"></i> Intermitencia</h4>
                    <div class="modal-script">${servicio.intermitencia || 'No especificado'}</div>
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

const app = new ReportesApp();
window.app = app;

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.toggle('hidden');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

const additionalStyles = `
.modal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.modal-section {
    background: var(--bg-light);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.modal-section h4 {
    margin-bottom: 12px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.modal-script {
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    background: white;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    max-height: 300px;
    overflow-y: auto;
}

.category-badge {
    display: inline-block;
    padding: 4px 8px;
    background: var(--bg-light);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-secondary);
}

.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-secondary); opacity: 0.7; }

.font-semibold { font-weight: 600; }

mark {
    background: #fef3c7;
    padding: 2px 4px;
    border-radius: 2px;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.dot-falla { background: #dc2626; }
.dot-normalidad { background: #059669; }
.dot-intermitencia { background: #d97706; }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
