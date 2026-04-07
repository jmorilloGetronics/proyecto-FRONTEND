import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function buildDom() {
  document.body.innerHTML = `
    <span id="role-chip" class="hidden"></span>
    <button id="header-logout-btn" class="hidden" type="button">Cerrar sesion</button>
    <div id="login-toast" class="hidden"></div>

    <section id="login-panel">
      <form id="login-form">
        <input id="username" value="usuario" />
        <input id="password" value="password" />
        <button type="submit">Entrar</button>
      </form>
      <p id="login-status"></p>
    </section>

    <section id="admin-panel" class="hidden">
      <form id="vehiculo-form">
        <input id="vehiculo-id" type="hidden" />
        <input id="vehiculo-marca" />
        <input id="vehiculo-modelo" />
        <input id="vehiculo-precio" type="number" />
        <input id="vehiculo-stock" type="checkbox" checked />
        <button id="guardar-vehiculo-btn" type="submit">Guardar vehiculo</button>
        <button id="cancelar-edicion-btn" type="button" class="hidden">Cancelar</button>
      </form>
      <p id="admin-status"></p>
    </section>

    <div id="lista-coches" class="hidden"></div>
  `;
}

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return body;
    }
  };
}

async function flushPromises() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function loadCatalogScript() {
  vi.resetModules();
  await import('../assets/js/catalogo.js');
}

describe('catalogo frontend', () => {
  beforeEach(() => {
    buildDom();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('permite login usuario y carga el listado', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'token-123', role: 'USER', username: 'usuario' }))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: '1', marca: 'Seat', modelo: 'Ibiza', precio: 12000, enStock: true }
        ])
      );

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.getElementById('login-status').textContent).toContain('Sesion iniciada como usuario');
    expect(document.getElementById('role-chip').textContent).toContain('Rol: USER');
    expect(document.getElementById('lista-coches').innerHTML).toContain('Seat');
  });

  it('muestra error si el login falla', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'Credenciales invalidas' }, false, 401));
    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();

    expect(document.getElementById('login-status').textContent).toContain('Credenciales invalidas');
    expect(document.getElementById('login-status').classList.contains('error')).toBe(true);
  });

  it('permite a admin crear un vehiculo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: '2' }, true, 201))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: '2', marca: 'Ford', modelo: 'Focus', precio: 18000, enStock: true }
        ])
      );

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';

    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.getElementById('vehiculo-marca').value = 'Ford';
    document.getElementById('vehiculo-modelo').value = 'Focus';
    document.getElementById('vehiculo-precio').value = '18000';

    document.getElementById('vehiculo-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[2][1].method).toBe('POST');

    const payload = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(payload).toMatchObject({
      marca: 'Ford',
      modelo: 'Focus',
      precio: 18000,
      enStock: true
    });

    expect(document.getElementById('admin-status').textContent).toContain('Vehiculo creado correctamente');
  });

  it('permite a admin editar un vehiculo', async () => {
    const coche = { id: '1', marca: 'Seat', modelo: 'Ibiza', precio: 12000, enStock: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([coche]))
      .mockResolvedValueOnce(jsonResponse({ ...coche, modelo: 'Ibiza FR' }))
      .mockResolvedValueOnce(jsonResponse([{ ...coche, modelo: 'Ibiza FR' }]));

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.querySelector('[data-action="edit"][data-id="1"]').click();
    await flushPromises();

    expect(document.getElementById('vehiculo-marca').value).toBe('Seat');
    expect(document.getElementById('guardar-vehiculo-btn').textContent).toContain('Actualizar');

    document.getElementById('vehiculo-modelo').value = 'Ibiza FR';
    document.getElementById('vehiculo-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    expect(fetchMock.mock.calls[2][1].method).toBe('PUT');
    expect(document.getElementById('admin-status').textContent).toContain('Vehiculo actualizado correctamente');
  });

  it('permite a admin eliminar un vehiculo', async () => {
    const coche = { id: '1', marca: 'Seat', modelo: 'Ibiza', precio: 12000, enStock: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([coche]))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse([]));

    global.fetch = fetchMock;
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.querySelector('[data-action="delete"][data-id="1"]').click();
    await flushPromises();
    await flushPromises();

    expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
    expect(document.getElementById('admin-status').textContent).toContain('Vehiculo eliminado correctamente');
  });

  it('cancela edicion al pulsar cancelar', async () => {
    const coche = { id: '1', marca: 'Seat', modelo: 'Ibiza', precio: 12000, enStock: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([coche]));

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.querySelector('[data-action="edit"][data-id="1"]').click();
    await flushPromises();

    document.getElementById('cancelar-edicion-btn').click();
    await flushPromises();

    expect(document.getElementById('admin-status').textContent).toContain('Edicion cancelada');
    expect(document.getElementById('vehiculo-marca').value).toBe('');
  });

  it('hace logout correctamente', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'token-123', role: 'USER', username: 'usuario' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({}));

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.getElementById('header-logout-btn').click();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(document.getElementById('login-status').textContent).toContain('Sesion cerrada');
    expect(document.getElementById('login-panel').classList.contains('hidden')).toBe(false);
  });

  it('muestra error si el formulario admin esta incompleto', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([]));

    global.fetch = fetchMock;

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.getElementById('vehiculo-marca').value = '';
    document.getElementById('vehiculo-modelo').value = '';
    document.getElementById('vehiculo-precio').value = '';
    document.getElementById('vehiculo-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(document.getElementById('admin-status').textContent).toContain('Completa marca');
  });

  it('no elimina si el usuario cancela el confirm', async () => {
    const coche = { id: '1', marca: 'Seat', modelo: 'Ibiza', precio: 12000, enStock: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'admin-token', role: 'ADMIN', username: 'admin' }))
      .mockResolvedValueOnce(jsonResponse([coche]));

    global.fetch = fetchMock;
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await loadCatalogScript();
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'pass123';
    document.getElementById('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
    await flushPromises();

    document.querySelector('[data-action="delete"][data-id="1"]').click();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});