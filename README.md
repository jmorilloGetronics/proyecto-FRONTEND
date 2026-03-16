# Proyecto Leo Frontend

Frontend web del proyecto Concesionario Leo. Este repositorio contiene una aplicacion estatica (sin Node, sin npm y sin build step) que consume la API del backend.

## Tecnologias
- HTML5
- CSS3
- JavaScript Vanilla (Fetch API)

## Requisitos
- Backend levantado en http://localhost:8080
- Navegador web moderno

## Arranque en local
1. Arrancar primero el backend.
2. Abrir index.html en el navegador.
3. Desde inicio, entrar al catalogo en catalogo.html.

La app consulta:
- http://localhost:8080/api/coches

## Estructura principal
```text
index.html
catalogo.html
assets/
	css/
		inicio.css
		catalogo.css
	js/
		catalogo.js
Jenkinsfile
```

## Integracion con backend
El frontend muestra el catalogo de coches llamando al endpoint GET /api/coches.

Si cambias host o puerto del backend, actualiza la URL en assets/js/catalogo.js.

## Roles y acceso
- usuario / password: consulta del catalogo.
- admin / pass123: acceso a panel CRUD (crear, editar y eliminar vehiculos).

## CI/CD (GitLab + Jenkins)
Este repositorio tiene pipeline separado del backend (2 repos, 2 pipelines).

Recomendaciones:
- Crear un job Jenkins propio para este repo.
- Apuntar a la rama que realmente usas (por ejemplo pruebaN1Leo si ahi vive el codigo).
- Mantener el Jenkinsfile del repo frontend independiente del backend.

## Flujo recomendado en GitLab
1. Hacer merge en la rama objetivo del frontend.
2. Disparar pipeline del frontend en Jenkins.
3. Validar que el frontend consume correctamente la API del backend desplegado.

## Notas
- Este repo no usa Maven ni pom.xml por diseno.
- El testing automatico del frontend depende de la estrategia de pipeline que configureis en Jenkins para repos estaticos.