# ⏰ Frontend - Configuración de Timezone Implementation

**Fecha**: 2025-01-28  
**Estado**: ✅ Completo  
**Versión**: 1.0  
**Módulo**: Frontend - Configuración de Usuario

---

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa del módulo frontend para la **Configuración de Zona Horaria** en React con TypeScript. El módulo permite a los usuarios configurar su zona horaria preferida para visualizar fechas y horas en su zona horaria local, mientras que el sistema backend procesa todas las fechas usando Madrid (Europe/Madrid) como referencia.

---

## 🎯 Funcionalidades Implementadas

### 1. Configuración de Timezone
- ✅ Visualización de timezone actual del usuario
- ✅ Lista completa de timezones disponibles con formato amigable
- ✅ Búsqueda/filtrado de timezones por nombre o código
- ✅ Detección automática de timezone del navegador
- ✅ Actualización de timezone del usuario
- ✅ Restablecimiento a timezone del sistema (Madrid)
- ✅ Información sobre la zona horaria del sistema
- ✅ Mensajes de éxito/error con feedback visual
- ✅ Estados de carga y validación

### 2. Integración con Backend
- ✅ Servicio API completo (`timezoneService.ts`)
- ✅ Manejo de errores robusto
- ✅ Uso de interceptores de autenticación existentes
- ✅ Tipos TypeScript para todas las respuestas

---

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── timezoneService.ts              # Cliente API para timezone
├── pages/
│   └── CRMTimezoneSettings.tsx         # Componente principal de configuración
└── App.tsx                              # Rutas (actualizado)
```

---

## 🔌 Integración con Backend

### Endpoints Utilizados

El servicio utiliza los siguientes endpoints del backend:

1. **GET `/api/v1/timezone/`**
   - Obtiene el timezone actual del usuario autenticado
   - Retorna: `{ timezone: string | null, system_timezone: string }`

2. **GET `/api/v1/timezone/available`**
   - Obtiene lista de timezones disponibles
   - Retorna: `{ timezones: Array<{ code: string, name: string, offset: string }> }`

3. **PUT `/api/v1/timezone/`**
   - Actualiza el timezone del usuario
   - Body: `{ timezone: string }`
   - Retorna: `{ timezone: string | null, system_timezone: string }`

4. **DELETE `/api/v1/timezone/`**
   - Restablece el timezone a la del sistema (elimina configuración personalizada)
   - Retorna: `{ timezone: null, system_timezone: string }`

### Servicio API

El servicio `timezoneService` (`src/services/timezoneService.ts`) encapsula todas las llamadas al backend:

```typescript
import { timezoneService } from '@/services/timezoneService';

// Obtener timezone actual
const current = await timezoneService.getCurrentTimezone();

// Obtener lista disponible
const available = await timezoneService.getAvailableTimezones();

// Actualizar timezone
await timezoneService.updateTimezone('America/New_York');

// Restablecer a sistema
await timezoneService.resetTimezone();
```

---

## 🎨 Componente de UI

### CRMTimezoneSettings

El componente principal (`src/pages/CRMTimezoneSettings.tsx`) proporciona:

1. **Header con navegación**
   - Botón para volver a configuración del CRM
   - Título con ícono de reloj
   - Descripción de la funcionalidad

2. **Información del Sistema**
   - Muestra la zona horaria del sistema (Europe/Madrid)
   - Explica que el sistema procesa fechas usando Madrid como referencia
   - Aclara que la configuración personal solo afecta la visualización

3. **Selector de Timezone**
   - Input de búsqueda para filtrar timezones
   - Botón para usar timezone detectado del navegador
   - Select dropdown con lista de timezones disponibles
   - Muestra offset de cada timezone
   - Indica timezone actual configurado

4. **Mensajes de Feedback**
   - Alertas de error (rojo)
   - Alertas de éxito (verde)
   - Auto-ocultado después de 3 segundos

5. **Botones de Acción**
   - "Guardar Cambios" (deshabilitado si no hay cambios)
   - "Restablecer a Europe/Madrid" (solo visible si hay configuración personal)

### Características Adicionales

- **Detección Automática**: Detecta y sugiere el timezone del navegador
- **Búsqueda Inteligente**: Filtra por nombre o código IANA
- **Validación**: No permite guardar sin seleccionar un timezone
- **Estados de Carga**: Muestra indicadores durante operaciones asíncronas
- **Manejo de Errores**: Muestra mensajes de error descriptivos

---

## 🛣️ Rutas

La configuración de timezone está disponible en:

- **Ruta principal**: `/crm/settings/timezone`
- **Acceso desde**: `/crm/settings` (tarjeta "Zona Horaria")

### Configuración en App.tsx

```typescript
// Lazy load del componente
const CRMTimezoneSettings = lazy(() => 
  import('@/pages/CRMTimezoneSettings').then(m => ({ default: m.CRMTimezoneSettings }))
);

// Ruta
<Route path="settings/timezone" element={
  <LazyLoadWrapper fallback="spinner">
    <CRMTimezoneSettings />
  </LazyLoadWrapper>
} />
```

---

## 📦 Dependencias

### Componentes UI Utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Estructura de tarjetas
- `Button` - Botones de acción
- `Input` - Campo de búsqueda
- `Label` - Etiquetas de formulario

### Iconos (lucide-react)

- `Clock` - Ícono de reloj para la sección
- `ArrowLeft` - Botón de retroceso
- `AlertCircle` - Ícono de error
- `CheckCircle2` - Ícono de éxito

### Servicios

- `timezoneService` - Cliente API
- `api` - Instancia de axios con interceptores de autenticación
- `getErrorMessage` - Utilidad para formatear errores

---

## 🎯 Flujo de Usuario

1. **Acceso**: Usuario navega a `/crm/settings` y hace clic en "Zona Horaria"
2. **Carga**: Se cargan el timezone actual y la lista de timezones disponibles
3. **Búsqueda** (opcional): Usuario busca un timezone específico
4. **Selección**: Usuario selecciona un timezone del dropdown
5. **Guardado**: Usuario hace clic en "Guardar Cambios"
6. **Confirmación**: Se muestra mensaje de éxito y se actualiza el estado

### Casos de Uso Adicionales

- **Detección Automática**: Usuario hace clic en "Usar zona horaria detectada"
- **Restablecimiento**: Usuario hace clic en "Restablecer a Europe/Madrid"
- **Sin Cambios**: Botón de guardar está deshabilitado si no hay cambios

---

## 🧪 Ejemplo de Uso

```typescript
import { timezoneService } from '@/services/timezoneService';

// En un componente React
const [timezone, setTimezone] = useState<string | null>(null);

useEffect(() => {
  const loadTimezone = async () => {
    const data = await timezoneService.getCurrentTimezone();
    setTimezone(data.timezone || data.system_timezone);
  };
  loadTimezone();
}, []);

const handleUpdate = async (newTimezone: string) => {
  try {
    await timezoneService.updateTimezone(newTimezone);
    // Actualizar estado local
    setTimezone(newTimezone);
  } catch (error) {
    // Manejar error
    console.error('Error updating timezone:', error);
  }
};
```

---

## 🔄 Conversión de Fechas (Futuro)

Para implementar la conversión de fechas en toda la aplicación, se pueden crear utilidades como:

```typescript
// utils/dateUtils.ts
export function convertToUserTimezone(
  backendDate: string,
  userTimezone: string
): Date {
  const date = new Date(backendDate);
  return new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));
}

export function formatDateForUser(
  date: Date,
  userTimezone: string,
  format: 'short' | 'long' | 'datetime' = 'datetime'
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: userTimezone,
    dateStyle: format === 'short' ? 'short' : format === 'long' ? 'long' : undefined,
    timeStyle: format === 'datetime' ? 'short' : undefined,
  };
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}
```

---

## ✅ Checklist de Implementación

- [x] Crear servicio API (`timezoneService.ts`)
- [x] Crear componente de configuración (`CRMTimezoneSettings.tsx`)
- [x] Agregar ruta en `App.tsx`
- [x] Agregar sección en `CRMSettings.tsx`
- [x] Implementar carga de timezone actual
- [x] Implementar carga de lista de timezones disponibles
- [x] Implementar actualización de timezone
- [x] Implementar restablecimiento a timezone del sistema
- [x] Agregar manejo de errores
- [x] Agregar mensajes de éxito/error
- [x] Implementar búsqueda/filtrado de timezones
- [x] Implementar detección automática de timezone del navegador
- [x] Agregar indicador visual de timezone actual
- [ ] Implementar conversión de fechas en toda la aplicación (futuro)
- [ ] Agregar tests unitarios (futuro)
- [ ] Agregar tests de integración (futuro)

---

## 📚 Referencias

- [Backend Timezone System](./BACKEND_TIMEZONE_SYSTEM.md) - Documentación del backend
- [API Endpoints - Timezone](../backend_implementation/app/api/endpoints/timezone.py)
- [Schemas - Timezone](../backend_implementation/app/schemas/timezone.py)

---

## 🔍 Notas Técnicas

### Autenticación

El servicio utiliza la instancia `api` de axios que incluye interceptores automáticos para:
- Agregar token de autenticación a todas las peticiones
- Refrescar token automáticamente cuando expira
- Manejar errores de autenticación

### Validación

- El backend valida que el timezone sea válido usando `pytz`
- El frontend valida que se seleccione un timezone antes de guardar
- Se muestra error descriptivo si el timezone no es válido

### Performance

- El componente usa lazy loading para reducir el bundle inicial
- La lista de timezones se carga una sola vez al montar el componente
- Los filtros se aplican localmente (no hay búsqueda en servidor)

---

**Última actualización**: 2025-01-28  
**Autor**: Sistema de Documentación Automática  
**Estado**: ✅ Implementación Completa

