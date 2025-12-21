# Instrucciones de Despliegue - Servicios Aislados

**Fecha:** 2025-01-27  
**Estado:** ✅ CONFIGURACIÓN COMPLETA

---

## 🎯 Objetivo

Desplegar Pili con **servicios completamente aislados**:
- **Servicio Python (FastAPI)**: API en `pili.migro.es/api` 
- **Servicio Node (React/Vite)**: Frontend en `pili.migro.es/`

---

## 📋 Arquitectura

```
┌─────────────────────────────────────────┐
│         pili.migro.es (DNS)             │
└─────────────────────────────────────────┘
           │
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────────┐   ┌─────────────┐
    │ Frontend │      │   API FastAPI│   │   ChromaDB  │
    │ React    │      │   Python     │   │   (Embedded)│
    │ Vite     │      │              │   │             │
    │ :9090    │      │   :8001      │   │   :8000     │
    └──────────┘      └──────────────┘   └─────────────┘
           │                  │
           │                  │
           └───────┬──────────┘
                   │
                   ▼
        Frontend → API (HTTPS)
        pili.migro.es → pili.migro.es/api
```

---

## 🔧 Configuración Actual

### 1. Frontend (React/Vite)

**Archivo:** `frontend/src/App.jsx`

El frontend usa una función inteligente para determinar la URL de la API:

```javascript
const getApiBaseUrl = () => {
  // Prioridad: variable de entorno
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Producción: URL completa del servicio API
  if (import.meta.env.PROD) {
    return 'https://pili.migro.es/api'
  }
  
  // Desarrollo local
  return 'http://localhost:8001/api'
}
```

**Puntos importantes:**
- ✅ En producción, se conecta a `https://pili.migro.es/api`
- ✅ En desarrollo, usa `http://localhost:8001/api`
- ✅ Puede sobrescribirse con variable `VITE_API_URL`

### 2. Dockerfile del Frontend

**Archivo:** `frontend/Dockerfile`

- **Multi-stage build**: Construye la app y luego sirve con Vite Preview
- **Puerto**: Usa `PORT` de Render o 9090 por defecto
- **Completamente independiente**: No necesita conexión a la API en build time

### 3. Configuración Render

**Archivo:** `render.yaml`

Dos servicios separados:
1. **pili-api**: Servicio Python/FastAPI
2. **pili-frontend**: Servicio Node/React

---

## 🚀 Instrucciones de Despliegue en Render

### Paso 1: Desplegar la API (Python/FastAPI)

1. **Crear servicio Web Service en Render:**
   - Nombre: `pili-api`
   - Región: Oregon (o la que prefieras)
   - Plan: Starter (o el que necesites)

2. **Configuración del servicio:**
   - **Build Command**: (vacío, Render usa el Dockerfile)
   - **Start Command**: (vacío, Render usa el CMD del Dockerfile)
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (raíz del proyecto)

3. **Variables de entorno (IMPORTANTES):**
   ```
   PYTHON_VERSION=3.12.0
   ENVIRONMENT=production
   API_HOST=0.0.0.0
   API_RELOAD=false
   LOG_LEVEL=INFO
   CORS_ENABLED=true
   MIGRO_API_BASE_URL=<tu-url-api-migro>
   MIGRO_API_KEY=<tu-api-key>
   OPENAI_API_KEY=<tu-openai-key>
   LLM_PROVIDER=openai
   OPENAI_MODEL=gpt-4o
   CHROMA_MODE=embedded
   SECRET_KEY=<genera-una-clave-secreta>
   ALLOWED_ORIGINS=https://pili.migro.es,https://app.migro.es,https://crm.migro.es,https://migro.app
   ```

4. **Asignar dominio personalizado (opcional):**
   - Si usas dominio personalizado: `api.pili.migro.es` o usar el mismo dominio con subruta
   - O usa la URL de Render: `pili-api.onrender.com`

5. **Verificar que la API funciona:**
   ```bash
   curl https://pili-api.onrender.com/api/pili/health
   # O si usas dominio personalizado:
   curl https://pili.migro.es/api/pili/health
   ```

### Paso 2: Desplegar el Frontend (React/Vite)

1. **Crear servicio Web Service en Render:**
   - Nombre: `pili-frontend`
   - Región: Oregon (misma que la API)
   - Plan: Starter

2. **Configuración del servicio:**
   - **Build Command**: (vacío, Render usa el Dockerfile)
   - **Start Command**: (vacío, Render usa el CMD del Dockerfile)
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Docker Context**: `./frontend`

3. **Variables de entorno:**
   ```
   NODE_VERSION=20
   VITE_API_URL=https://pili-api.onrender.com/api
   ```
   
   **⚠️ IMPORTANTE:** 
   - Si usas dominio personalizado para la API: `VITE_API_URL=https://pili.migro.es/api`
   - Esta variable se inyecta en **BUILD TIME**, no en runtime
   - Si Render no permite build args, necesitarás crear un `.env.production` (ver alternativa abajo)

4. **Asignar dominio personalizado:**
   - Dominio: `pili.migro.es` (raíz)
   - Esto servirá el frontend desde la raíz

5. **Verificar que el frontend funciona:**
   - Abre `https://pili.migro.es/` en el navegador
   - Deberías ver la interfaz de Pili
   - Haz una consulta de prueba

### Paso 3: Configurar Proxy/DNS (si necesario)

Si ambos servicios usan el mismo dominio:

**Opción A: Usar Render Static Site + API Proxy** (Recomendado)
- Render permite configurar rutas estáticas y proxy para `/api`

**Opción B: Usar nginx como proxy reverso** (Más control)
- Configurar nginx para:
  - `/` → Frontend (puerto 9090)
  - `/api` → API (puerto 8001)

**Opción C: Dominios separados** (Más simple)
- Frontend: `pili.migro.es`
- API: `api.pili.migro.es`
- Cambiar `VITE_API_URL` a `https://api.pili.migro.es/api`

---

## 🔄 Desarrollo Local

### Ejecutar servicios por separado

**Terminal 1 - API:**
```bash
cd /ruta/al/proyecto
docker-compose up pili-api
# O directamente:
# uvicorn src.pili.main:app --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Verificar:**
- Frontend: `http://localhost:9090`
- API: `http://localhost:8001/api/pili/health`

### Con Docker Compose (ambos servicios)

```bash
docker-compose up --build
```

Los servicios están aislados pero pueden comunicarse vía red Docker.

---

## 🐛 Troubleshooting

### Problema: Frontend no puede conectar con la API

**Síntoma:** Error CORS o "Network Error"

**Solución:**
1. Verificar que la API esté corriendo:
   ```bash
   curl https://pili.migro.es/api/pili/health
   ```

2. Verificar CORS en la API:
   - Debe incluir `https://pili.migro.es` en `ALLOWED_ORIGINS`
   - Verificar logs de la API en Render

3. Verificar la URL en el frontend:
   - Abrir DevTools → Console
   - Verificar que `API_BASE_URL` sea correcta
   - Debería ser `https://pili.migro.es/api` en producción

### Problema: VITE_API_URL no se inyecta en build

**Síntoma:** El frontend usa la URL por defecto en lugar de la variable

**Solución:**
Crear archivo `frontend/.env.production`:
```env
VITE_API_URL=https://pili-api.onrender.com/api
```

Y modificar el Dockerfile para copiarlo:
```dockerfile
COPY .env.production .env.production
RUN npm run build
```

### Problema: Puerto no disponible en Render

**Síntoma:** El servicio no arranca

**Solución:**
- Render inyecta automáticamente `PORT`
- El Dockerfile ya está configurado para usar `${PORT:-9090}`
- No debería haber problemas

### Problema: Build del frontend falla

**Síntoma:** Error en `npm run build`

**Solución:**
1. Verificar que todas las dependencias estén en `package.json`
2. Verificar logs de build en Render
3. Probar build localmente:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

---

## 📝 Checklist de Despliegue

### API (pili-api)
- [ ] Servicio creado en Render
- [ ] Dockerfile configurado correctamente
- [ ] Variables de entorno configuradas
- [ ] `ALLOWED_ORIGINS` incluye `https://pili.migro.es`
- [ ] Health check funciona: `curl https://pili-api.onrender.com/api/pili/health`
- [ ] CORS configurado correctamente

### Frontend (pili-frontend)
- [ ] Servicio creado en Render
- [ ] Dockerfile configurado correctamente
- [ ] `VITE_API_URL` configurada (build time)
- [ ] Dominio personalizado asignado: `pili.migro.es`
- [ ] Frontend carga correctamente
- [ ] Puede hacer requests a la API (verificar en DevTools)

### Verificación Final
- [ ] Frontend se carga en `https://pili.migro.es/`
- [ ] API responde en `https://pili.migro.es/api/pili/health`
- [ ] Frontend puede hacer consultas a la API
- [ ] No hay errores CORS en la consola
- [ ] Las respuestas de Pili se muestran correctamente

---

## 🔐 Seguridad

### Variables de Entorno Sensibles

**Nunca commits:**
- `OPENAI_API_KEY`
- `MIGRO_API_KEY`
- `SECRET_KEY`

**Configurar solo en Render Dashboard → Environment Variables**

### CORS

La API debe tener `ALLOWED_ORIGINS` configurado:
```
https://pili.migro.es,https://app.migro.es,https://crm.migro.es,https://migro.app
```

El regex también permite subdominios de `migro.es` y `migro.app`.

---

## 📚 Archivos Relevantes

- `frontend/src/App.jsx` - Configuración de URL de API
- `frontend/vite.config.js` - Configuración de Vite
- `frontend/Dockerfile` - Build y servidor del frontend
- `src/pili/main.py` - Configuración FastAPI y CORS
- `src/pili/config.py` - Variables de configuración
- `render.yaml` - Configuración de servicios en Render

---

## 🆘 Soporte

Si tienes problemas:

1. **Ver logs en Render:**
   - Dashboard → Servicio → Logs
   - Buscar errores de build o runtime

2. **Verificar configuración:**
   - Variables de entorno
   - URLs de dominios
   - CORS settings

3. **Probar localmente:**
   - Reproducir el problema en local
   - Verificar que funciona antes de desplegar

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Instrucciones completas para servicios aislados

