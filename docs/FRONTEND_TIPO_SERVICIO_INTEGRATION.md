# 🔌 Guía de Integración - Componentes Tipo Servicio

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Oportunidades CRM  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Instalación](#instalación)
2. [Configuración Inicial](#configuración-inicial)
3. [Integración en OpportunityDetail](#integración-en-opportunitydetail)
4. [Configuración de Autenticación](#configuración-de-autenticación)
5. [Personalización de Estilos](#personalización-de-estilos)
6. [Testing de Integración](#testing-de-integración)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Instalación

### 1. Copiar Archivos

Copiar los componentes al proyecto frontend:

```bash
# Desde frontend_components/ al proyecto
cp TipoServicioSelector.tsx src/components/opportunities/
cp FirstCallSummary.tsx src/components/opportunities/
cp OpportunityTipoServicioSection.tsx src/components/opportunities/
cp styles.css src/components/opportunities/tipo-servicio.css
```

### 2. Instalar Dependencias

```bash
npm install lucide-react
# o
yarn add lucide-react
```

### 3. Verificar Tipos TypeScript

Asegurarse de que los tipos estén definidos en `src/types/`:

```typescript
// src/types/tipoServicio.ts
export interface TipoServicio {
  code: string;
  name: string;
  category: string;
  description?: string;
  requires_nationality?: boolean;
  valid_nationalities?: string[];
}

export interface TipoServicioResponse {
  servicios: TipoServicio[];
  total: number;
}
```

---

## ⚙️ Configuración Inicial

### 1. Importar Estilos

En el archivo principal de estilos (`src/index.css` o `src/App.css`):

```css
@import './components/opportunities/tipo-servicio.css';
```

O en el componente principal:

```typescript
// src/App.tsx
import './components/opportunities/tipo-servicio.css';
```

### 2. Configurar React Query (si no está configurado)

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 3. Crear Hook para Tipo Servicios

```typescript
// src/hooks/useTipoServicios.ts
import { useQuery } from '@tanstack/react-query';
import { tipoServicioApi } from '../services/tipoServicioApi';

export function useTipoServicios() {
  return useQuery({
    queryKey: ['tipoServicios'],
    queryFn: () => tipoServicioApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}
```

### 4. Crear Servicio API

```typescript
// src/services/tipoServicioApi.ts
import { api } from './api';
import { TipoServicioResponse } from '../types/tipoServicio';

export const tipoServicioApi = {
  list: async (): Promise<TipoServicioResponse> => {
    const response = await api.get('/crm/tipo-servicios');
    return response.data;
  },
  
  get: async (code: string) => {
    const response = await api.get(`/crm/tipo-servicios/${code}`);
    return response.data;
  },
};
```

---

## 🔗 Integración en OpportunityDetail

### 1. Importar Componentes

```typescript
// src/pages/OpportunityDetail.tsx
import { OpportunityTipoServicioSection } from '../components/opportunities/OpportunityTipoServicioSection';
import { useOpportunityDetail } from '../hooks/useOpportunityDetail';
```

### 2. Usar el Componente

```typescript
export function OpportunityDetail({ opportunityId }: { opportunityId: string }) {
  const { data: opportunity, isLoading } = useOpportunityDetail(opportunityId);
  
  const handleSave = async (data: { tipoServicio: string; summary: string }) => {
    // Llamar a API para guardar
    await opportunityApi.update(opportunityId, {
      tipo_servicio: data.tipoServicio,
      first_call_summary: data.summary,
    });
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="opportunity-detail">
      {/* Otros campos */}
      
      <OpportunityTipoServicioSection
        opportunityId={opportunityId}
        initialTipoServicio={opportunity?.tipo_servicio}
        initialSummary={opportunity?.first_call_summary}
        nacionalidad={opportunity?.contact?.nacionalidad}
        onSave={handleSave}
      />
      
      {/* Más campos */}
    </div>
  );
}
```

### 3. Integración con Formulario Existente

Si ya existe un formulario, integrar los componentes individualmente:

```typescript
import { TipoServicioSelector } from '../components/opportunities/TipoServicioSelector';
import { FirstCallSummary } from '../components/opportunities/FirstCallSummary';

export function OpportunityForm({ opportunity }: Props) {
  const [tipoServicio, setTipoServicio] = useState(opportunity?.tipo_servicio || '');
  const [summary, setSummary] = useState(opportunity?.first_call_summary || '');
  
  return (
    <form>
      {/* Otros campos del formulario */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TipoServicioSelector
          value={tipoServicio}
          onChange={setTipoServicio}
          nacionalidad={opportunity?.contact?.nacionalidad}
        />
        
        <FirstCallSummary
          value={summary}
          onChange={setSummary}
          minLength={50}
          maxLength={1000}
        />
      </div>
      
      <button type="submit">Guardar</button>
    </form>
  );
}
```

---

## 🔐 Configuración de Autenticación

### 1. Verificar Interceptor de API

Asegurarse de que el interceptor de API incluye el token de autenticación:

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };
```

### 2. Manejo de Errores de Autenticación

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🎨 Personalización de Estilos

### 1. Usar con Tailwind CSS

Los componentes están diseñados para funcionar con Tailwind CSS. Asegurarse de que Tailwind esté configurado:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'tipo-servicio-primary': '#10b981',
      },
    },
  },
};
```

### 2. Personalizar Colores

Modificar las variables CSS en `tipo-servicio.css`:

```css
:root {
  --tipo-servicio-primary: #your-color;
  --tipo-servicio-primary-hover: #your-hover-color;
}
```

### 3. Integrar con Design System Existente

Si existe un design system, adaptar los componentes:

```typescript
// Usar componentes del design system
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Reemplazar elementos HTML nativos con componentes del design system
```

---

## 🧪 Testing de Integración

### 1. Test de Renderizado

```typescript
// src/components/opportunities/__tests__/OpportunityTipoServicioSection.test.tsx
import { render, screen } from '@testing-library/react';
import { OpportunityTipoServicioSection } from '../OpportunityTipoServicioSection';

describe('OpportunityTipoServicioSection', () => {
  it('renders correctly', () => {
    render(
      <OpportunityTipoServicioSection
        opportunityId="123"
        initialTipoServicio="asilo"
        initialSummary="Resumen de prueba"
      />
    );
    
    expect(screen.getByText(/tipo de servicio/i)).toBeInTheDocument();
    expect(screen.getByText(/resumen/i)).toBeInTheDocument();
  });
});
```

### 2. Test de Interacción

```typescript
import { fireEvent, waitFor } from '@testing-library/react';

it('saves data when save button is clicked', async () => {
  const onSave = jest.fn();
  
  render(
    <OpportunityTipoServicioSection
      opportunityId="123"
      onSave={onSave}
    />
  );
  
  const saveButton = screen.getByRole('button', { name: /guardar/i });
  fireEvent.click(saveButton);
  
  await waitFor(() => {
    expect(onSave).toHaveBeenCalled();
  });
});
```

### 3. Test de Mobile

```typescript
import { useMediaQuery } from '@testing-library/react';

it('shows bottom sheet on mobile', () => {
  // Mock mobile viewport
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query === '(max-width: 767px)',
  }));
  
  render(<TipoServicioSelector />);
  
  // Verificar que se muestra bottom sheet
});
```

---

## 🐛 Troubleshooting

### Problema: Los componentes no se renderizan

**Solución:**
1. Verificar que los archivos estén en la ubicación correcta
2. Verificar imports (rutas relativas/absolutas)
3. Verificar que las dependencias estén instaladas
4. Revisar la consola del navegador para errores

### Problema: Error de autenticación en API

**Solución:**
1. Verificar que el token esté en localStorage
2. Verificar que el interceptor de API esté configurado
3. Verificar que el endpoint del backend esté disponible
4. Revisar CORS si es necesario

### Problema: Estilos no se aplican

**Solución:**
1. Verificar que `tipo-servicio.css` esté importado
2. Verificar que Tailwind CSS esté configurado
3. Verificar que no haya conflictos de CSS
4. Revisar la especificidad de los estilos

### Problema: Bottom sheet no funciona en mobile

**Solución:**
1. Verificar que `useMediaQuery` esté funcionando
2. Verificar que el viewport meta tag esté configurado:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```
3. Verificar que no haya CSS que bloquee el overlay

### Problema: Búsqueda no funciona

**Solución:**
1. Verificar que el hook `useDebounce` esté implementado
2. Verificar que los datos de servicios estén cargando correctamente
3. Revisar la consola para errores de API

---

## 📝 Checklist de Integración

- [ ] Archivos copiados al proyecto
- [ ] Dependencias instaladas (`lucide-react`)
- [ ] Estilos importados
- [ ] Tipos TypeScript definidos
- [ ] Servicio API creado
- [ ] Hook personalizado creado
- [ ] Componentes integrados en OpportunityDetail
- [ ] Autenticación configurada
- [ ] Tests escritos
- [ ] Pruebas en mobile realizadas
- [ ] Accesibilidad verificada
- [ ] Performance optimizada

---

## 🚀 Próximos Pasos

1. **Integrar en producción**
   - Deploy a staging
   - Pruebas de usuario
   - Ajustes según feedback

2. **Monitoreo**
   - Configurar analytics
   - Monitorear errores
   - Medir performance

3. **Mejoras continuas**
   - Recopilar feedback
   - Iterar en UX
   - Optimizar performance

---

**Última actualización**: 2025-01-28
