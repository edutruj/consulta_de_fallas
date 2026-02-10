class CRUDScripts {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.cargarScriptsLista();
        const form = document.getElementById('scriptForm');
        if (form) {
            form.addEventListener('submit', (e) => this.guardarScript(e));
        }
    }

    mostrarFormularioNuevo() {
        const form = document.getElementById('formScript');
        const lista = document.getElementById('listaScripts');
        const titulo = document.getElementById('formTitulo');
        
        if (!form || !lista || !titulo) return;
        
        document.getElementById('scriptForm').reset();
        document.getElementById('scriptId').value = '';
        
        ['Falla', 'Normalidad', 'Intermitencia'].forEach(tipo => {
            const countElement = document.getElementById(`count${tipo}`);
            if (countElement) countElement.textContent = '0 caracteres';
        });
        
        form.classList.remove('hidden');
        lista.classList.add('hidden');
        titulo.textContent = 'Nuevo Script';
        
        const servicioNombre = document.getElementById('servicioNombre');
        if (servicioNombre) servicioNombre.focus();
    }

    editarScript(servicio) {
        const form = document.getElementById('formScript');
        const lista = document.getElementById('listaScripts');
        const titulo = document.getElementById('formTitulo');
        
        if (!form || !lista || !titulo) return;
        
        document.getElementById('scriptId').value = servicio.servicio;
        document.getElementById('servicioNombre').value = servicio.servicio;
        document.getElementById('servicioCategoria').value = servicio.categoria || 'general';
        document.getElementById('scriptFalla').value = servicio.falla || '';
        document.getElementById('scriptNormalidad').value = servicio.normalidad || '';
        document.getElementById('scriptIntermitencia').value = servicio.intermitencia || '';
        
        document.getElementById('countFalla').textContent = `${servicio.falla?.length || 0} caracteres`;
        document.getElementById('countNormalidad').textContent = `${servicio.normalidad?.length || 0} caracteres`;
        document.getElementById('countIntermitencia').textContent = `${servicio.intermitencia?.length || 0} caracteres`;
        
        form.classList.remove('hidden');
        lista.classList.add('hidden');
        titulo.textContent = 'Editar Script';
        
        if ($('#servicioCategoria').length) {
            $('#servicioCategoria').val(servicio.categoria || 'general').trigger('change');
        }
    }

    async guardarScript(event) {
        event.preventDefault();
        
        const id = document.getElementById('scriptId').value;
        const nombre = document.getElementById('servicioNombre').value.trim();
        const categoria = document.getElementById('servicioCategoria').value;
        const falla = document.getElementById('scriptFalla').value.trim();
        const normalidad = document.getElementById('scriptNormalidad').value.trim();
        const intermitencia = document.getElementById('scriptIntermitencia').value.trim();
        
        if (!nombre) {
            this.app.mostrarNotificacion('El nombre del servicio es requerido', 'error');
            return;
        }
        
        if (!falla && !normalidad && !intermitencia) {
            this.app.mostrarNotificacion('Debe completar al menos uno de los scripts', 'error');
            return;
        }
        
        const nuevoServicio = {
            servicio: nombre,
            categoria: categoria,
            falla: falla,
            normalidad: normalidad,
            intermitencia: intermitencia
        };
        
        if (id && id !== nombre) {
            this.app.servicios = this.app.servicios.filter(s => s.servicio !== id);
        }
        
        const indiceExistente = this.app.servicios.findIndex(s => s.servicio === nombre);
        if (indiceExistente >= 0 && nombre !== id) {
            this.app.servicios[indiceExistente] = nuevoServicio;
        } else {
            if (indiceExistente >= 0) {
                this.app.servicios[indiceExistente] = nuevoServicio;
            } else {
                this.app.servicios.push(nuevoServicio);
            }
        }
        
        this.app.guardarServicios();
        this.cargarScriptsLista();
        this.app.cargarTabla();
        this.cancelarEdicion();
        
        this.app.mostrarNotificacion(
            id ? 'Script actualizado correctamente' : 'Script creado correctamente',
            'success'
        );
    }

    cancelarEdicion() {
        const form = document.getElementById('formScript');
        const lista = document.getElementById('listaScripts');
        
        if (form) form.classList.add('hidden');
        if (lista) lista.classList.remove('hidden');
        
        const scriptForm = document.getElementById('scriptForm');
        if (scriptForm) scriptForm.reset();
    }

    eliminarScript(nombreServicio) {
        if (!confirm(`¿Estás seguro de eliminar el script "${nombreServicio}"?`)) {
            return;
        }
        
        this.app.servicios = this.app.servicios.filter(s => s.servicio !== nombreServicio);
        this.app.guardarServicios();
        this.cargarScriptsLista();
        this.app.cargarTabla();
        
        this.app.mostrarNotificacion('Script eliminado correctamente', 'success');
    }

    cargarScriptsLista() {
        const container = document.getElementById('scriptsContainer');
        if (!container) return;
        
        if (this.app.servicios.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay scripts guardados.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        this.app.servicios.forEach(servicio => {
            const scriptItem = this.crearScriptItem(servicio);
            container.appendChild(scriptItem);
        });
    }

    crearScriptItem(servicio) {
        const div = document.createElement('div');
        div.className = 'script-item';
        
        const categoria = servicio.categoria || 'general';
        const categoriaTexto = this.app.obtenerTextoCategoria(categoria);
        const preview = this.crearPreview(servicio.falla || servicio.normalidad || servicio.intermitencia);
        
        div.innerHTML = `
            <div class="script-header">
                <div>
                    <div class="script-title">${servicio.servicio}</div>
                    <span class="script-category">${categoriaTexto}</span>
                </div>
                <div class="script-actions">
                    <button class="btn btn-copy" onclick="crud.editarScript(${JSON.stringify(servicio).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="crud.eliminarScript('${this.app.escapeHtml(servicio.servicio)}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="script-preview">${preview}</div>
            <div class="script-stats">
                <small class="text-muted">
                    Falla: ${servicio.falla?.length || 0} chars | 
                    Normalidad: ${servicio.normalidad?.length || 0} chars | 
                    Intermitencia: ${servicio.intermitencia?.length || 0} chars
                </small>
            </div>
        `;
        
        return div;
    }

    crearPreview(texto, maxLength = 150) {
        if (!texto) return '<span class="text-muted">Sin contenido</span>';
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength) + '...';
    }

    filtrarScripts() {
        const busqueda = document.getElementById('buscarScripts').value.toLowerCase();
        const items = document.querySelectorAll('.script-item');
        
        items.forEach(item => {
            const titulo = item.querySelector('.script-title').textContent.toLowerCase();
            const preview = item.querySelector('.script-preview').textContent.toLowerCase();
            const categoria = item.querySelector('.script-category').textContent.toLowerCase();
            
            const coincide = titulo.includes(busqueda) || 
                            preview.includes(busqueda) || 
                            categoria.includes(busqueda);
            
            item.style.display = coincide ? '' : 'none';
        });
    }

    exportarBackup() {
        const data = {
            servicios: this.app.servicios,
            exportado: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-scripts-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.app.mostrarNotificacion('Backup exportado correctamente', 'success');
    }

    importarBackup() {
        const input = document.getElementById('importBackupInput');
        if (input) input.click();
    }
}

setTimeout(() => {
    const crud = new CRUDScripts(app);
    window.crud = crud;
}, 100);