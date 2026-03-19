class CRUDScripts {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.cargarScriptsLista();

        const input = document.getElementById('buscarScripts');
        if (input) {
            input.addEventListener('keyup', () => this.filtrarScripts());
        }

        document.addEventListener('click', (e) => {
            const form = document.getElementById('formScript');
            const lista = document.getElementById('listaScripts');

            if (
                form &&
                !form.contains(e.target) &&
                !e.target.closest('.btn') &&
                !form.classList.contains('hidden')
            ) {
                this.cancelarEdicion();
            }
        });
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
        form.style.display = 'block';

        lista.classList.add('hidden');
        lista.style.display = 'none';

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
        form.style.display = 'block';

        lista.classList.add('hidden');
        lista.style.display = 'none';

        titulo.textContent = 'Editar Script';
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
            categoria,
            falla,
            normalidad,
            intermitencia
        };

        if (id && id !== nombre) {
            this.app.servicios = this.app.servicios.filter(s => s.servicio !== id);
        }

        const indiceExistente = this.app.servicios.findIndex(s => s.servicio === nombre);

        if (indiceExistente >= 0) {
            this.app.servicios[indiceExistente] = nuevoServicio;
        } else {
            this.app.servicios.push(nuevoServicio);
        }

        this.app.guardarServicios();
        this.cargarScriptsLista();
        this.app.cargarTabla();

        setTimeout(() => {
            this.cancelarEdicion();
        }, 100);

        const mensaje = id ? 'Script actualizado correctamente' : 'Script creado correctamente';
        this.app.mostrarNotificacion(mensaje, 'success');
    }

    cancelarEdicion() {
        const form = document.getElementById('formScript');
        const lista = document.getElementById('listaScripts');

        if (form) {
            form.classList.add('hidden');
            form.style.display = 'none';
        }

        if (lista) {
            lista.classList.remove('hidden');
            lista.style.display = 'block';
        }

        const scriptForm = document.getElementById('scriptForm');
        if (scriptForm) scriptForm.reset();
    }

    eliminarScript(nombreServicio) {
        if (!confirm(`¿Estás seguro de eliminar el script "${nombreServicio}"?`)) return;

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

        this.app.servicios.forEach((servicio, index) => {
            const scriptItem = this.crearScriptItem(servicio, index);
            container.appendChild(scriptItem);
        });
    }

    crearScriptItem(servicio, index) {
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
                    <button class="btn btn-copy edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger delete-btn" data-servicio="${servicio.servicio}">
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

        div.querySelector('.edit-btn').addEventListener('click', () => {
            this.editarScript(servicio);
        });

        div.querySelector('.delete-btn').addEventListener('click', () => {
            this.eliminarScript(servicio.servicio);
        });

        return div;
    }

    crearPreview(texto, maxLength = 150) {
        if (!texto) return '<span class="text-muted">Sin contenido</span>';
        return texto.length <= maxLength ? texto : texto.substring(0, maxLength) + '...';
    }

    filtrarScripts() {
        const busqueda = document.getElementById('buscarScripts').value.toLowerCase();
        const items = document.querySelectorAll('.script-item');

        items.forEach(item => {
            const titulo = item.querySelector('.script-title').textContent.toLowerCase();
            const preview = item.querySelector('.script-preview').textContent.toLowerCase();
            const categoria = item.querySelector('.script-category').textContent.toLowerCase();

            const coincide =
                titulo.includes(busqueda) ||
                preview.includes(busqueda) ||
                categoria.includes(busqueda);

            item.style.display = coincide ? '' : 'none';
        });
    }
}

function inicializarCRUD() {
    if (typeof app !== 'undefined' && app.servicios) {
        const crud = new CRUDScripts(app);
        window.crud = crud;

        if (!app.crud) {
            app.crud = crud;
        }
    } else {
        setTimeout(inicializarCRUD, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCRUD);
} else {
    inicializarCRUD();
}

window.guardarScript = function(event) {
    if (window.crud) {
        window.crud.guardarScript(event);
    }
};

window.cancelarEdicion = function() {
    if (window.crud) {
        window.crud.cancelarEdicion();
    }
};

window.filtrarScripts = function() {
    if (window.crud) {
        window.crud.filtrarScripts();
    }
};
