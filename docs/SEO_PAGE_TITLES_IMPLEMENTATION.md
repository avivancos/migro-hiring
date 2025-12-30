# Implementación de Títulos Dinámicos para SEO

## 📋 Resumen

Se ha implementado un sistema de títulos dinámicos que actualiza automáticamente el `<title>` de cada página según la ruta actual, mejorando significativamente el SEO y la experiencia de usuario.

## 🎯 Objetivos

- **SEO Mejorado**: Cada página tiene un título descriptivo y único
- **UX Mejorada**: Los usuarios pueden identificar fácilmente en qué parte de la aplicación se encuentran
- **Mantenibilidad**: Sistema centralizado y fácil de extender

## 🏗️ Arquitectura

### Componentes Implementados

1. **`src/config/pageTitles.ts`**: Configuración centralizada de títulos
2. **`src/hooks/usePageTitle.ts`**: Hook React para actualizar títulos automáticamente
3. **`src/App.tsx`**: Integración del hook en el componente principal

## 📁 Estructura de Archivos

```
src/
├── config/
│   └── pageTitles.ts          # Mapeo de rutas a títulos
├── hooks/
│   └── usePageTitle.ts        # Hook para actualizar títulos
└── App.tsx                     # Integración del hook
```

## 🔧 Implementación

### 1. Configuración de Títulos (`src/config/pageTitles.ts`)

Este archivo contiene:
- **`PAGE_TITLES`**: Objeto con mapeo de rutas exactas a títulos
- **`getPageTitle(pathname: string)`**: Función que resuelve el título para cualquier ruta

#### Formato de Títulos

Todos los títulos siguen el formato:
```
"[Descripción de la página] | Migro.es"
```

Ejemplos:
- `"Inicio - Contratación y Pago de Servicios Legales | Migro.es"`
- `"Contactos - CRM | Migro.es"`
- `"Panel de Administración | Migro.es"`

#### Manejo de Rutas Dinámicas

El sistema maneja automáticamente rutas con parámetros:
- `/crm/contacts/123` → `"Detalle de Contacto | Migro.es"`
- `/admin/users/456` → `"Detalle de Usuario | Migro.es"`
- `/contratacion/ABC123` → `"Contratación de Servicios | Migro.es"`

### 2. Hook `usePageTitle` (`src/hooks/usePageTitle.ts`)

Hook que:
- Detecta cambios en la ruta actual usando `useLocation()` de React Router
- Actualiza `document.title` automáticamente
- Soporta títulos personalizados si se pasa como parámetro

#### Uso Básico

```tsx
function MyPage() {
  usePageTitle(); // Actualiza el título automáticamente según la ruta
  return <div>Mi página</div>;
}
```

#### Uso con Título Personalizado

```tsx
function MyPage() {
  usePageTitle('Título Personalizado | Migro.es');
  return <div>Mi página</div>;
}
```

### 3. Integración en App.tsx

El hook se integra en `AppContent()` para que se ejecute en todas las rutas:

```tsx
function AppContent() {
  useTokenRefresh();
  usePageTitle(); // Actualiza títulos automáticamente
  
  return <Routes>...</Routes>;
}
```

## 📝 Títulos Configurados

### Páginas Públicas
- `/` → `"Inicio - Contratación y Pago de Servicios Legales | Migro.es"`
- `/expirado` → `"Enlace Expirado | Migro.es"`
- `/404` → `"Página No Encontrada | Migro.es"`
- `/privacidad` → `"Política de Privacidad | Migro.es"`
- `/privacy` → `"Privacy Policy | Migro.es"`

### Módulo CRM
- `/crm` → `"CRM - Gestión de Clientes | Migro.es"`
- `/crm/contacts` → `"Contactos - CRM | Migro.es"`
- `/crm/contacts/new` → `"Nuevo Contacto | Migro.es"`
- `/crm/contacts/:id` → `"Detalle de Contacto | Migro.es"`
- `/crm/contacts/:id/edit` → `"Editar Contacto | Migro.es"`
- `/crm/leads` → `"Leads - CRM | Migro.es"`
- `/crm/opportunities` → `"Oportunidades - CRM | Migro.es"`
- `/crm/calendar` → `"Calendario - CRM | Migro.es"`
- `/crm/expedientes` → `"Expedientes - CRM | Migro.es"`
- `/crm/call` → `"Manejo de Llamadas - CRM | Migro.es"`
- `/crm/settings` → `"Configuración - CRM | Migro.es"`

### Módulo Admin
- `/admin` → `"Panel de Administración | Migro.es"`
- `/admin/dashboard` → `"Dashboard - Panel de Administración | Migro.es"`
- `/admin/users` → `"Gestión de Usuarios | Migro.es"`
- `/admin/users/create` → `"Crear Usuario | Migro.es"`
- `/admin/users/:id` → `"Detalle de Usuario | Migro.es"`
- `/admin/contracts` → `"Contratos - Administración | Migro.es"`
- `/admin/audit-logs` → `"Logs de Auditoría | Migro.es"`

### Rutas de Contratación
- `/contratacion/:code` → `"Contratación de Servicios | Migro.es"`
- `/hiring/:code` → `"Hiring Services | Migro.es"`

## 🔄 Cómo Agregar Nuevos Títulos

### Para Rutas Estáticas

Agregar entrada en `PAGE_TITLES`:

```typescript
export const PAGE_TITLES: Record<string, string> = {
  // ... títulos existentes
  '/nueva-ruta': 'Nuevo Título | Migro.es',
};
```

### Para Rutas Dinámicas

El sistema detecta automáticamente rutas con parámetros. Si necesitas un comportamiento específico, agregar lógica en `getPageTitle()`:

```typescript
export function getPageTitle(pathname: string): string {
  // ... código existente
  
  // Nuevo patrón
  if (pathname.startsWith('/nueva-seccion/')) {
    return 'Nueva Sección | Migro.es';
  }
  
  // ... resto del código
}
```

## ✅ Beneficios SEO

1. **Títulos Únicos**: Cada página tiene un título descriptivo y único
2. **Palabras Clave**: Los títulos incluyen palabras clave relevantes
3. **Estructura Consistente**: Formato uniforme facilita el indexado
4. **Mejor CTR**: Títulos descriptivos mejoran el click-through rate en resultados de búsqueda

## 🧪 Testing

Para verificar que los títulos se actualizan correctamente:

1. Navegar entre diferentes rutas
2. Verificar que el título en la pestaña del navegador cambia
3. Verificar que el título coincide con la ruta actual

### Verificación Manual

```javascript
// En la consola del navegador
console.log(document.title); // Debe mostrar el título actual
```

## 📚 Referencias

- [React Router - useLocation](https://reactrouter.com/en/main/hooks/use-location)
- [MDN - document.title](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)
- [Google SEO - Title Tags](https://developers.google.com/search/docs/appearance/title-link)

## 🔮 Mejoras Futuras

1. **Meta Descriptions Dinámicas**: Extender el sistema para incluir meta descriptions
2. **Open Graph Tags**: Agregar soporte para Open Graph y Twitter Cards
3. **Canonical URLs**: Implementar URLs canónicas dinámicas
4. **Breadcrumbs Schema**: Agregar schema markup para breadcrumbs
5. **Títulos Basados en Datos**: Permitir títulos dinámicos basados en datos de la API (ej: nombre del contacto)

## 📝 Notas Técnicas

- El hook se ejecuta en cada cambio de ruta gracias a `useLocation()`
- El título por defecto se usa si no se encuentra una coincidencia
- El sistema es extensible y fácil de mantener
- No afecta el rendimiento ya que solo actualiza el DOM cuando cambia la ruta

## 🎨 Ejemplo de Uso en Componentes

Si necesitas un título personalizado en un componente específico:

```tsx
import { usePageTitle } from '@/hooks/usePageTitle';

function ContactDetailPage({ contact }: { contact: Contact }) {
  // Título personalizado con datos del contacto
  usePageTitle(`${contact.name} - Detalle de Contacto | Migro.es`);
  
  return <div>...</div>;
}
```

---

**Fecha de Implementación**: 2024
**Última Actualización**: 2024








