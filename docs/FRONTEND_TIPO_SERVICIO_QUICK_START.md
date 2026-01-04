# 🚀 Quick Start - Componentes Tipo Servicio

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Oportunidades CRM  
**Tiempo estimado**: 15 minutos

---

## ⚡ Inicio Rápido

### 1. Copiar Archivos (2 min)

```bash
# Copiar componentes
cp frontend_components/TipoServicioSelector.tsx src/components/opportunities/
cp frontend_components/FirstCallSummary.tsx src/components/opportunities/
cp frontend_components/OpportunityTipoServicioSection.tsx src/components/opportunities/
cp frontend_components/styles.css src/components/opportunities/tipo-servicio.css
```

### 2. Instalar Dependencias (1 min)

```bash
npm install lucide-react
# o
yarn add lucide-react
```

### 3. Importar Estilos (1 min)

En `src/index.css` o `src/App.tsx`:

```typescript
import './components/opportunities/tipo-servicio.css';
```

### 4. Usar el Componente (5 min)

```typescript
import { OpportunityTipoServicioSection } from './components/opportunities/OpportunityTipoServicioSection';

function OpportunityDetail({ opportunityId }: Props) {
  const handleSave = async (data: { tipoServicio: string; summary: string }) => {
    // Guardar datos
    await api.update(`/opportunities/${opportunityId}`, data);
  };
  
  return (
    <OpportunityTipoServicioSection
      opportunityId={opportunityId}
      onSave={handleSave}
    />
  );
}
```

### 5. Configurar API (5 min)

Crear servicio API básico:

```typescript
// src/services/tipoServicioApi.ts
import { api } from './api';

export const tipoServicioApi = {
  list: async () => {
    const response = await api.get('/crm/tipo-servicios');
    return response.data;
  },
};
```

---

## 📝 Ejemplo Mínimo

```typescript
import { TipoServicioSelector } from './components/opportunities/TipoServicioSelector';
import { FirstCallSummary } from './components/opportunities/FirstCallSummary';

function MyComponent() {
  const [tipoServicio, setTipoServicio] = useState('');
  const [summary, setSummary] = useState('');
  
  return (
    <div>
      <TipoServicioSelector
        value={tipoServicio}
        onChange={setTipoServicio}
      />
      
      <FirstCallSummary
        value={summary}
        onChange={setSummary}
        minLength={50}
        maxLength={1000}
      />
    </div>
  );
}
```

---

## ✅ Verificación

1. ✅ Componentes se renderizan sin errores
2. ✅ Dropdown se abre al hacer clic
3. ✅ Búsqueda funciona
4. ✅ Selección funciona
5. ✅ Textarea auto-resize funciona
6. ✅ Contador de caracteres funciona
7. ✅ Guardado funciona

---

## 🐛 Problemas Comunes

### Error: "Cannot find module 'lucide-react'"
**Solución**: `npm install lucide-react`

### Error: "Styles not applied"
**Solución**: Verificar que `tipo-servicio.css` esté importado

### Error: "API 401 Unauthorized"
**Solución**: Verificar que el token de autenticación esté configurado

---

## 📚 Documentación Completa

- [Resumen de Componentes](FRONTEND_TIPO_SERVICIO_COMPONENTS_SUMMARY.md)
- [Guía Técnica](FRONTEND_TIPO_SERVICIO_TECNICAL.md)
- [Guía de Integración](FRONTEND_TIPO_SERVICIO_INTEGRATION.md)
- [Guía de Testing](FRONTEND_TIPO_SERVICIO_TESTING.md)
- [Guía de Accesibilidad](FRONTEND_TIPO_SERVICIO_ACCESSIBILITY.md)

---

**Última actualización**: 2025-01-28
