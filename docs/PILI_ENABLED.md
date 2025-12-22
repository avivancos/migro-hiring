# Pili AI - Habilitación del Servicio

**Fecha:** 2025-01-27  
**Estado:** ✅ HABILITADO

---

## 📋 Resumen

Se ha habilitado la funcionalidad de Pili AI en el frontend, conectándolo al servicio externo de Pili que está desplegado de forma independiente.

---

## ✅ Cambios Realizados

### 1. Configuración de URL de API

**Archivo:** `src/config/constants.ts`

Se agregó una constante para la URL base del servicio de Pili:

```typescript
export const PILI_API_BASE_URL = import.meta.env.VITE_PILI_API_URL || 
  (import.meta.env.PROD 
    ? 'https://pili.migro.es/api' 
    : 'http://localhost:8001/api');
```

**Configuración:**
- **Producción**: `https://pili.migro.es/api`
- **Desarrollo**: `http://localhost:8001/api`
- **Variable de entorno**: `VITE_PILI_API_URL` (prioridad sobre defaults)

### 2. Servicio de Pili Actualizado

**Archivo:** `src/services/piliService.ts`

Se actualizó el servicio para conectarse al servicio externo de Pili usando axios:

```typescript
const piliApi = axios.create({
  baseURL: PILI_API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

**Endpoints:**
- `GET /pili/health` - Verificar estado del servicio
- `POST /pili/chat` - Enviar mensaje al chat

**Características:**
- ✅ Instancia de axios separada (sin interceptores de autenticación)
- ✅ Manejo de errores mejorado
- ✅ Timeout configurable
- ✅ Health check retorna estado en lugar de lanzar error (para mejor UX)

### 3. Ruta Habilitada

**Archivo:** `src/App.tsx`

Se habilitó la ruta `/pili` como ruta **pública** (sin autenticación):

```typescript
import { AdminPili } from '@/pages/admin/AdminPili';

// Dentro de las rutas públicas:
<Route path="/pili" element={<AdminPili />} />
```

**Acceso:**
- URL: `/pili`
- **Pública** - No requiere autenticación
- Accesible desde la raíz de la aplicación

**Nota:** Aunque el componente se llama `AdminPili`, está en una ruta pública y puede ser accedido por cualquier usuario sin necesidad de autenticación.

---

## 🔧 Configuración

### Variables de Entorno

**Para desarrollo local:**
```env
VITE_PILI_API_URL=http://localhost:8001/api
```

**Para producción:**
```env
VITE_PILI_API_URL=https://pili.migro.es/api
```

**Nota:** Si no se configura `VITE_PILI_API_URL`, el sistema usa los valores por defecto según el entorno.

---

## 📡 Endpoints del Servicio de Pili

### Health Check

```typescript
GET /pili/health
```

**Respuesta:**
```typescript
{
  status: 'healthy' | 'unhealthy',
  service: 'pili',
  sdk_available: boolean,
  compendio_loaded?: boolean,
  error?: string
}
```

### Chat

```typescript
POST /pili/chat
Content-Type: application/json

{
  message: string,
  conversation_id?: string | null,
  context?: {
    conversation_history?: Array<{
      role: 'user' | 'assistant',
      content: string
    }>
  }
}
```

**Respuesta:**
```typescript
{
  response: string,
  conversation_id: string
}
```

---

## 🔄 Flujo de Uso

1. **Usuario accede a `/pili`**
   - **No requiere autenticación** - Es una ruta pública
   - Se verifica automáticamente el health del servicio

2. **Usuario envía mensaje**
   - El componente `AdminPili` llama a `piliService.chat()`
   - Se envía request a `/pili/chat`
   - Se muestra la respuesta en el chat

3. **Manejo de errores**
   - Si el servicio no está disponible, se muestra mensaje de error amigable
   - El health check muestra el estado del servicio

---

## 🐛 Troubleshooting

### Problema: No se puede conectar al servicio

**Síntoma:** Error "No se pudo conectar con el servicio de Pili"

**Solución:**
1. Verificar que el servicio de Pili esté corriendo:
   ```bash
   curl http://localhost:8001/api/pili/health  # Desarrollo
   curl https://pili.migro.es/api/pili/health  # Producción
   ```

2. Verificar la variable de entorno `VITE_PILI_API_URL` está configurada correctamente

3. Verificar que no haya problemas de CORS (el servicio de Pili debe permitir el origen del frontend)

### Problema: El health check siempre muestra "unhealthy"

**Síntoma:** El estado del servicio siempre es "unhealthy"

**Solución:**
1. Verificar que el endpoint `/pili/health` exista en el servicio de Pili
2. Verificar los logs del servicio de Pili
3. Verificar que la URL base sea correcta

### Problema: CORS Error

**Síntoma:** Error de CORS en la consola del navegador

**Solución:**
1. Verificar que el servicio de Pili tenga configurado CORS correctamente
2. El servicio debe permitir el origen del frontend (ej: `https://app.migro.es`)
3. Verificar la configuración de `ALLOWED_ORIGINS` en el servicio de Pili

---

## 📁 Archivos Modificados

- `src/config/constants.ts` - Agregada constante `PILI_API_BASE_URL`
- `src/services/piliService.ts` - Actualizado para conectarse al servicio externo
- `src/App.tsx` - Habilitada ruta pública `/pili` (sin autenticación)
- `src/components/admin/Sidebar.tsx` - Eliminado link "Pili AI" (ya no está en admin)

---

## 📚 Referencias

- Documentación de despliegue: `pili/DESPLIEGUE_SERVICIOS_AISLADOS.md`
- Componente de UI: `src/pages/admin/AdminPili.tsx`
- Tipos TypeScript: `src/types/pili.ts`

---

## 🔮 Futuras Mejoras

- [ ] Agregar autenticación específica para el servicio de Pili si es necesario
- [ ] Implementar rate limiting en el frontend
- [ ] Agregar indicadores de carga mejorados
- [ ] Implementar historial de conversaciones persistente

---

**Última actualización:** 2025-01-27

