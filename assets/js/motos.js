const API_BASE = 'http://localhost:8082/api';

const contenedor = document.getElementById('lista-motos');
const loginForm = document.getElementById('login-form');
const loginPanel = document.getElementById('login-panel');
const headerLogoutBtn = document.getElementById('header-logout-btn');
const roleChip = document.getElementById('role-chip');
const loginToast = document.getElementById('login-toast');
const loginStatus = document.getElementById('login-status');
const adminPanel = document.getElementById('admin-panel');
const adminStatus = document.getElementById('admin-status');
const vehiculoForm = document.getElementById('vehiculo-form');
const vehiculoIdInput = document.getElementById('vehiculo-id');
const vehiculoMarcaInput = document.getElementById('vehiculo-marca');
const vehiculoModeloInput = document.getElementById('vehiculo-modelo');
const vehiculoPrecioInput = document.getElementById('vehiculo-precio');
const vehiculoStockInput = document.getElementById('vehiculo-stock');
const guardarVehiculoBtn = document.getElementById('guardar-vehiculo-btn');
const cancelarEdicionBtn = document.getElementById('cancelar-edicion-btn');

let authToken = null;
let authRole = null;
let motosCache = [];
let loginToastTimeout = null;

function esAdmin() {
    return authRole === 'ADMIN';
}

function actualizarEstado(mensaje, esError = false) {
    loginStatus.textContent = mensaje;
    loginStatus.classList.toggle('error', esError);
}

function actualizarAdminEstado(mensaje, esError = false) {
    adminStatus.textContent = mensaje;
    adminStatus.classList.toggle('error', esError);
    adminStatus.classList.toggle('success', !esError && mensaje.trim() !== '');
}

function mostrarLoginToast(mensaje) {
    loginToast.textContent = mensaje;
    loginToast.classList.remove('hidden');
    loginToast.classList.add('visible');

    if (loginToastTimeout) {
        clearTimeout(loginToastTimeout);
    }

    loginToastTimeout = setTimeout(() => {
        loginToast.classList.remove('visible');
        setTimeout(() => {
            loginToast.classList.add('hidden');
        }, 250);
    }, 5000);
}

function limpiarFormularioAdmin() {
    vehiculoForm.reset();
    vehiculoIdInput.value = '';
    guardarVehiculoBtn.textContent = 'Guardar moto';
    cancelarEdicionBtn.classList.add('hidden');
}

function limpiarEstadoSesion() {
    authToken = null;
    authRole = null;
    motosCache = [];

    roleChip.classList.add('hidden');
    roleChip.textContent = '';
    headerLogoutBtn.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    actualizarAdminEstado('');
    limpiarFormularioAdmin();
    contenedor.innerHTML = '';
    contenedor.classList.add('hidden');
}

async function extraerMensajeError(response, mensajePorDefecto) {
    try {
        const data = await response.json();
        if (data && typeof data.message === 'string' && data.message.trim() !== '') {
            return data.message;
        }
    } catch (error) {
        return mensajePorDefecto;
    }

    return mensajePorDefecto;
}

function cabecerasAutorizadas(conJson = false) {
    const headers = {
        Authorization: `Bearer ${authToken}`
    };

    if (conJson) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}

function pintarMotos(motos) {
    motosCache = motos;

    if (motos.length === 0) {
        contenedor.innerHTML = '<div class="card"><h2>Sin vehiculos</h2><p>No hay motos cargadas en este momento.</p></div>';
        return;
    }

    contenedor.innerHTML = motos.map((m) => `
        <div class="card">
            <h2>${m.marca}</h2>
            <p>${m.modelo}</p>
            <div class="precio">${m.precio.toLocaleString()} €</div>
            <p><span class="badge ${m.enStock ? 'stock' : 'no-stock'}">
                ${m.enStock ? 'Disponible' : 'Reservado'}
            </span></p>
            ${esAdmin() ? `
            <div class="card-actions">
                <button type="button" class="action-btn edit-btn" data-action="edit" data-id="${m.id}">Editar</button>
                <button type="button" class="action-btn delete-btn" data-action="delete" data-id="${m.id}">Eliminar</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

async function cargarMotos() {
    if (!authToken) {
        return;
    }

    const response = await fetch(`${API_BASE}/motos`, {
        headers: cabecerasAutorizadas()
    });

    if (!response.ok) {
        throw new Error(await extraerMensajeError(response, 'No se pudo cargar el listado de motos.'));
    }

    const motos = await response.json();
    pintarMotos(motos);
    contenedor.classList.remove('hidden');
}

function iniciarEdicion(id) {
    const moto = motosCache.find((item) => item.id === id);
    if (!moto) {
        actualizarAdminEstado('No se encontro la moto para editar.', true);
        return;
    }

    vehiculoIdInput.value = moto.id;
    vehiculoMarcaInput.value = moto.marca;
    vehiculoModeloInput.value = moto.modelo;
    vehiculoPrecioInput.value = moto.precio;
    vehiculoStockInput.checked = moto.enStock;
    guardarVehiculoBtn.textContent = 'Actualizar moto';
    cancelarEdicionBtn.classList.remove('hidden');
    actualizarAdminEstado(`Editando moto ${moto.id}.`);
}

async function crearVehiculo(payload) {
    const response = await fetch(`${API_BASE}/motos`, {
        method: 'POST',
        headers: cabecerasAutorizadas(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await extraerMensajeError(response, 'No se pudo crear la moto.'));
    }
}

async function actualizarVehiculo(id, payload) {
    const response = await fetch(`${API_BASE}/motos/${id}`, {
        method: 'PUT',
        headers: cabecerasAutorizadas(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await extraerMensajeError(response, 'No se pudo actualizar la moto.'));
    }
}

async function eliminarVehiculo(id) {
    const response = await fetch(`${API_BASE}/motos/${id}`, {
        method: 'DELETE',
        headers: cabecerasAutorizadas()
    });

    if (!response.ok) {
        throw new Error(await extraerMensajeError(response, 'No se pudo eliminar la moto.'));
    }
}

function obtenerPayloadFormulario() {
    const marca = vehiculoMarcaInput.value.trim();
    const modelo = vehiculoModeloInput.value.trim();
    const precio = Number.parseInt(vehiculoPrecioInput.value, 10);

    if (marca === '' || modelo === '' || Number.isNaN(precio) || precio < 0) {
        throw new Error('Completa marca, modelo y precio valido.');
    }

    return {
        marca,
        modelo,
        precio,
        enStock: vehiculoStockInput.checked
    };
}

async function manejarSubmitVehiculo(event) {
    event.preventDefault();
    if (!esAdmin()) {
        return;
    }

    try {
        const payload = obtenerPayloadFormulario();
        const vehiculoId = vehiculoIdInput.value.trim();

        if (vehiculoId === '') {
            await crearVehiculo(payload);
            actualizarAdminEstado('Moto creada correctamente.');
            mostrarLoginToast('Moto creada');
        } else {
            await actualizarVehiculo(vehiculoId, payload);
            actualizarAdminEstado('Moto actualizada correctamente.');
            mostrarLoginToast('Moto actualizada');
        }

        limpiarFormularioAdmin();
        await cargarMotos();
    } catch (error) {
        actualizarAdminEstado(error.message || 'No se pudo guardar la moto.', true);
    }
}

function cancelarEdicion() {
    limpiarFormularioAdmin();
    actualizarAdminEstado('Edicion cancelada.');
}

async function manejarAccionesListado(event) {
    const boton = event.target.closest('button[data-action]');
    if (!boton || !esAdmin()) {
        return;
    }

    const { action, id } = boton.dataset;
    if (!id) {
        return;
    }

    if (action === 'edit') {
        iniciarEdicion(id);
        return;
    }

    if (action === 'delete') {
        const confirmar = window.confirm('Quieres eliminar esta moto?');
        if (!confirmar) {
            return;
        }

        try {
            await eliminarVehiculo(id);

            if (vehiculoIdInput.value === id) {
                limpiarFormularioAdmin();
            }

            actualizarAdminEstado('Moto eliminada correctamente.');
            mostrarLoginToast('Moto eliminada');
            await cargarMotos();
        } catch (error) {
            actualizarAdminEstado(error.message || 'No se pudo eliminar la moto.', true);
        }
    }
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    actualizarEstado('Validando credenciales...');

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(await extraerMensajeError(response, 'Usuario o contrasena incorrectos.'));
        }

        const data = await response.json();
        authToken = data.token;
        authRole = data.role;

        roleChip.textContent = `Rol: ${data.role}`;
        roleChip.classList.remove('hidden');
        headerLogoutBtn.classList.remove('hidden');
        loginPanel.classList.add('hidden');

        adminPanel.classList.toggle('hidden', !esAdmin());
        limpiarFormularioAdmin();
        if (esAdmin()) {
            actualizarAdminEstado('Modo administrador activo: puedes crear, editar y eliminar motos.');
        } else {
            actualizarAdminEstado('');
        }

        actualizarEstado(`Sesion iniciada como ${data.username}.`);
        mostrarLoginToast(`Login correcto (${data.role})`);

        await cargarMotos();
    } catch (error) {
        limpiarEstadoSesion();
        actualizarEstado(error.message || 'No se pudo iniciar sesion.', true);
    }
}

async function logout() {
    if (!authToken) {
        return;
    }

    try {
        await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: cabecerasAutorizadas()
        });
    } finally {
        limpiarEstadoSesion();
        actualizarEstado('Sesion cerrada. Vuelve a iniciar sesion para continuar.');
    }
}

loginForm.addEventListener('submit', login);
headerLogoutBtn.addEventListener('click', logout);
vehiculoForm.addEventListener('submit', manejarSubmitVehiculo);
cancelarEdicionBtn.addEventListener('click', cancelarEdicion);
contenedor.addEventListener('click', manejarAccionesListado);
