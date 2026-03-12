const contenedor = document.getElementById('lista-coches');

// Llamamos a tu API de Java
fetch('http://localhost:8080/api/coches')
    .then(res => res.json())
    .then(coches => {
        contenedor.innerHTML = coches.map(c => `
            <div class="card">
                <h2>${c.marca}</h2>
                <p>${c.modelo}</p>
                <div class="precio">${c.precio.toLocaleString()} €</div>
                <p><span class="badge ${c.enStock ? 'stock' : 'no-stock'}">
                    ${c.enStock ? '✅ Disponible' : '❌ Reservado'}
                </span></p>
            </div>
        `).join('');
    })
    .catch(err => contenedor.innerHTML = "<h3>Oye bro, ¿has arrancado el Backend? 😅</h3>");