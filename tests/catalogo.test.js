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
  const unique = `${Date.now()}-${Math.random()}`;
  await import(`../assets/js/catalogo.js?${unique}`);
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
});