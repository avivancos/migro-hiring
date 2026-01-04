# 📘 Guía Técnica - Componentes Tipo Servicio

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Oportunidades CRM  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Arquitectura de Componentes](#arquitectura-de-componentes)
2. [TipoServicioSelector](#tiposervicioselector)
3. [FirstCallSummary](#firstcallsummary)
4. [OpportunityTipoServicioSection](#opportunitytiposerviciosection)
5. [Estilos y Temas](#estilos-y-temas)
6. [API y Estado](#api-y-estado)
7. [Optimizaciones](#optimizaciones)

---

## 🏗️ Arquitectura de Componentes

### Estructura de Archivos

```
frontend_components/
├── TipoServicioSelector.tsx          # Selector principal con búsqueda
├── FirstCallSummary.tsx              # Editor de resumen de primera llamada
├── OpportunityTipoServicioSection.tsx # Sección completa integrada
└── styles.css                        # Estilos mobile-first
```

### Dependencias

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🎯 TipoServicioSelector

### Props Interface

```typescript
interface TipoServicioSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  nacionalidad?: string; // Para validación
  placeholder?: string;
  className?: string;
}
```

### Características Técnicas

#### 1. Búsqueda con Debounce

```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  // Filtrar servicios basado en debouncedSearch
}, [debouncedSearch]);
```

#### 2. Agrupación por Categoría

```typescript
const groupedServices = useMemo(() => {
  const groups: Record<string, TipoServicio[]> = {};
  
  filteredServices.forEach(service => {
    const category = service.category || 'Otros';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
  });
  
  return groups;
}, [filteredServices]);
```

#### 3. Validación Nacionalidad/Asilo

```typescript
const validateService = (service: TipoServicio): boolean => {
  // Si el servicio requiere nacionalidad específica
  if (service.requires_nationality && !nacionalidad) {
    return false;
  }
  
  // Si es asilo y no tiene nacionalidad válida
  if (service.code === 'asilo' && nacionalidad !== 'sin_papeles') {
    return false;
  }
  
  return true;
};
```

#### 4. Mobile Bottom Sheet

```typescript
const [isOpen, setIsOpen] = useState(false);
const isMobile = useMediaQuery('(max-width: 767px)');

// Prevenir scroll del body cuando está abierto
useEffect(() => {
  if (isOpen && isMobile) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen, isMobile]);
```

#### 5. Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    setIsOpen(false);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    // Navegar al siguiente item
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    // Navegar al item anterior
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // Seleccionar item actual
  }
};
```

---

## 📝 FirstCallSummary

### Props Interface

```typescript
interface FirstCallSummaryProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}
```

### Características Técnicas

#### 1. Auto-resize Textarea

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }
}, [value]);
```

#### 2. Contador de Caracteres

```typescript
const characterCount = value.length;
const isOverLimit = characterCount > maxLength;
const isUnderLimit = characterCount < minLength;

const getCharacterCountColor = () => {
  if (isOverLimit) return 'text-red-500';
  if (isUnderLimit) return 'text-yellow-500';
  return 'text-gray-500';
};
```

#### 3. Auto-save con Debounce

```typescript
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

const debouncedSave = useDebounce(async (value: string) => {
  if (onSave && value.length >= minLength) {
    setIsSaving(true);
    try {
      await onSave(value);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }
}, autoSaveDelay || 2000);

useEffect(() => {
  if (autoSave) {
    debouncedSave(value);
  }
}, [value, autoSave]);
```

#### 4. Indicador de Cambios No Guardados

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

useEffect(() => {
  if (value !== lastSavedValue) {
    setHasUnsavedChanges(true);
  } else {
    setHasUnsavedChanges(false);
  }
}, [value, lastSavedValue]);
```

---

## 🔗 OpportunityTipoServicioSection

### Props Interface

```typescript
interface OpportunityTipoServicioSectionProps {
  opportunityId: string;
  initialTipoServicio?: string;
  initialSummary?: string;
  nacionalidad?: string;
  onTipoServicioChange?: (value: string) => void;
  onSummaryChange?: (value: string) => void;
  onSave?: (data: { tipoServicio: string; summary: string }) => Promise<void>;
  className?: string;
}
```

### Características Técnicas

#### 1. Manejo de Estado Integrado

```typescript
const [tipoServicio, setTipoServicio] = useState(initialTipoServicio || '');
const [summary, setSummary] = useState(initialSummary || '');
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  if (onSave) {
    setIsSaving(true);
    try {
      await onSave({
        tipoServicio,
        summary
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }
};
```

#### 2. Layout Responsive

```typescript
return (
  <div className={cn(
    "space-y-6",
    "md:grid md:grid-cols-2 md:gap-6 md:space-y-0",
    className
  )}>
    <div className="md:col-span-1">
      <TipoServicioSelector
        value={tipoServicio}
        onChange={setTipoServicio}
        nacionalidad={nacionalidad}
      />
    </div>
    <div className="md:col-span-1">
      <FirstCallSummary
        value={summary}
        onChange={setSummary}
        onSave={handleSave}
      />
    </div>
  </div>
);
```

---

## 🎨 Estilos y Temas

### Variables CSS

```css
:root {
  --tipo-servicio-primary: #10b981;
  --tipo-servicio-primary-hover: #059669;
  --tipo-servicio-error: #ef4444;
  --tipo-servicio-success: #10b981;
  --tipo-servicio-warning: #f59e0b;
  
  --bottom-sheet-backdrop: rgba(0, 0, 0, 0.5);
  --bottom-sheet-bg: #ffffff;
  --bottom-sheet-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
  
  --touch-target-min: 44px;
  --spacing-touch: 12px;
}
```

### Animaciones

```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bottom-sheet-enter {
  animation: slideUp 0.3s ease-out;
}

.bottom-sheet-exit {
  animation: slideUp 0.3s ease-out reverse;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .bottom-sheet-enter,
  .bottom-sheet-exit {
    animation: none;
  }
  
  * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🔌 API y Estado

### Tipos de Datos

```typescript
interface TipoServicio {
  code: string;
  name: string;
  category: string;
  description?: string;
  requires_nationality?: boolean;
  valid_nationalities?: string[];
}

interface TipoServicioResponse {
  servicios: TipoServicio[];
  total: number;
}
```

### Llamadas API

```typescript
const fetchTipoServicios = async (): Promise<TipoServicioResponse> => {
  const response = await fetch('/api/crm/tipo-servicios', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Error fetching tipo servicios');
  }
  
  return response.json();
};
```

### Estado con React Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['tipoServicios'],
  queryFn: fetchTipoServicios,
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000 // 10 minutos
});
```

---

## ⚡ Optimizaciones

### 1. Memoización

```typescript
const filteredServices = useMemo(() => {
  if (!debouncedSearch) return servicios;
  
  return servicios.filter(service =>
    service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    service.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [servicios, debouncedSearch]);
```

### 2. Lazy Loading

```typescript
const TipoServicioSelector = lazy(() => 
  import('./TipoServicioSelector')
);

<Suspense fallback={<LoadingSpinner />}>
  <TipoServicioSelector {...props} />
</Suspense>
```

### 3. Virtualización (para listas grandes)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: filteredServices.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
  overscan: 5
});
```

### 4. Code Splitting

```typescript
// En el bundle principal
const OpportunityTipoServicioSection = lazy(() =>
  import('./OpportunityTipoServicioSection')
);
```

---

## 🐛 Manejo de Errores

### Error Boundaries

```typescript
class TipoServicioErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Error States

```typescript
if (error) {
  return (
    <div role="alert" className="error-container">
      <p>Error cargando servicios</p>
      <button onClick={refetch}>Reintentar</button>
    </div>
  );
}
```

---

## 📊 Performance Metrics

### Métricas Objetivo

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Bundle Size**: < 50KB (gzipped)

### Monitoring

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

**Última actualización**: 2025-01-28
