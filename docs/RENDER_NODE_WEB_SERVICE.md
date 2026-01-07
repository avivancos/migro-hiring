# Render - Configuración como **Node Web Service** (Vite + Express)

Este documento explica cómo desplegar `migro-hiring` como **Web Service (Node)** en Render, en vez de **Static Site**.

> Nota: este repo ya incluye configuración de Static Site en `render.yaml` / `render-static.yaml`.  
> Este documento es para el caso en que Render te pide crear un “Node New Web Service”.

---

## Objetivo

- Servir el build de Vite (`dist/`) usando un servidor Node (`Express`).
- Soportar **SPA routing** (fallback a `index.html`).
- Exponer un endpoint de health check para Render: **`/healthz`**.

---

## Archivos involucrados

- `server.js`: servidor Express que sirve `dist/` y maneja fallback SPA.
- `render-node.yaml`: blueprint opcional para crear el servicio en Render como Node.
- `package.json`: agrega `express` y script `start`.

---

## Render Dashboard (UI) - Valores recomendados

En la pantalla “New Web Service”:

- **Language**: `Node`
- **Branch**: `main`
- **Root Directory**: vacío (repo root)
- **Build Command**:
  - `npm ci --legacy-peer-deps && npm run build`
- **Start Command**:
  - `npm start`
- **Health Check Path**:
  - `/healthz`

---

## Variables de entorno (Render)

Estas variables se usan en build (Vite) y/o runtime:

- `NODE_VERSION=20`
- `VITE_API_BASE_URL=https://api.migro.es/api`
- `VITE_APP_URL=https://contratacion.migro.es`
- `VITE_STRIPE_PUBLISHABLE_KEY` (secreto, setear manualmente)
- `VITE_DEBUG_MODE=false`
- `VITE_API_TIMEOUT=30000`

Render inyecta `PORT` automáticamente; `server.js` respeta `process.env.PORT`.

### Fijar versión de Node (evitar el default de Render)

Render puede usar una versión default (ej. 22.x) si no se especifica. En este repo se fijó:

- Archivo `.node-version`: `20`
- `package.json` → `engines.node`: `20.x`

Adicionalmente, si configuras el servicio desde el Dashboard, mantén `NODE_VERSION=20`.

---

## Verificación local (Docker)

Si quieres validar el build/serve en contenedor:

- Construir y servir con el servidor Node no está cubierto por el `Dockerfile` actual (usa nginx).
- Alternativas:
  - Usar el `Dockerfile` actual (nginx) para validar el build.
  - O crear un Dockerfile específico para Node si se requiere (no es obligatorio para Render Node runtime).

---

## Notas de operación

- El health check es `/healthz` (simple y rápido).
- El fallback SPA hace que rutas tipo `/admin/opportunities/123` funcionen sin 404 al refrescar.

---

## Troubleshooting

### Error: "Rollup failed to resolve import react-is"

**Causa**: `recharts` requiere `react-is` como peer dependency pero no siempre se instala automáticamente.

**Solución**: Ya está agregado `react-is` en `dependencies` de `package.json`. Si el error persiste:
```bash
npm install react-is --save
npm install --package-lock-only --legacy-peer-deps
```
