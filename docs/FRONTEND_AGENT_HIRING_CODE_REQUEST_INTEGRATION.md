# 🔌 Guía de Integración - Solicitud de Código de Contratación

**Fecha**: 2025-01-28  
**Módulo**: Frontend - CRM Opportunities  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Instalación](#instalación)
2. [Configuración Inicial](#configuración-inicial)
3. [Integración en OpportunityDetail](#integración-en-opportunitydetail)
4. [Configuración de Permisos](#configuración-de-permisos)
5. [Personalización](#personalización)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Instalación

### 1. Instalar Dependencias

```bash
npm install react-hook-form zod @hookform/resolvers lucide-react
# o
yarn add react-hook-form zod @hookform/resolvers lucide-react
```

### 2. Crear Tipos TypeScript

```typescript
// src/types/hiringCode.ts
export interface AgentHiringCodeRequest {
  agent_signature: string;
  contract_template: string;
  catalog_item_id?: number;
  service_name?: string;
  amount?: number;
  grade?: 'A' | 'B' | 'C' | 'T';
  payment_type?: 'one_time' | 'subscription';
  expires_in_days?: number;
  currency?: string;
  // ... otros campos
}

export interface AgentHiringCodeResponse {
  success: boolean;
  message: string;
  hiring_code: string;
  hiring_code_id: null;
  pipeline_stage_id: string;
  email_sent: boolean;
}
```

### 3. Crear Servicio API

```typescript
// src/services/hiringCodeApi.ts
import { api } from './api';
import { AgentHiringCodeRequest, AgentHiringCodeResponse } from '../types/hiringCode';

export const hiringCodeApi = {
  request: async ({
    entityType,
    entityId,
    data,
  }: {
    entityType: 'contacts' | 'leads';
    entityId: string;
    data: AgentHiringCodeRequest;
  }): Promise<AgentHiringCodeResponse> => {
    const response = await api.post(
      `/pipelines/stages/${entityType}/${entityId}/request-hiring-code`,
      data
    );
    return response.data;
  },
};
```

---

## ⚙️ Configuración Inicial

### 1. Crear Hook Personalizado

```typescript
// src/hooks/useRequestHiringCode.ts
import { useMutation } from '@tanstack/react-query';
import { hiringCodeApi } from '../services/hiringCodeApi';
import { AgentHiringCodeRequest } from '../types/hiringCode';

export function useRequestHiringCode() {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      data,
    }: {
      entityType: 'contacts' | 'leads';
      entityId: string;
      data: AgentHiringCodeRequest;
    }) => hiringCodeApi.request({ entityType, entityId, data }),
    onSuccess: (data) => {
      // Opcional: mostrar notificación de éxito
      console.log('Código generado:', data.hiring_code);
    },
    onError: (error) => {
      // Opcional: mostrar notificación de error
      console.error('Error al solicitar código:', error);
    },
  });
}
```

### 2. Crear Componente Principal

```typescript
// src/components/opportunities/RequestHiringCodeForm.tsx
// Ver docs/FRONTEND_AGENT_HIRING_CODE_REQUEST_TECHNICAL.md
```

---

## 🔗 Integración en OpportunityDetail

### 1. Verificar Condiciones de Visibilidad

```typescript
// src/pages/OpportunityDetail.tsx

const canRequestHiringCode = useMemo(() => {
  // Verificar que la situación esté completada
  if (!opportunity?.situacion_migrante) {
    return false;
  }
  
  // Verificar que el pipeline esté en estado válido
  const currentStage = opportunity?.pipeline?.current_stage;
  const validStages = ['agent_initial', 'lawyer_validation'];
  
  if (!currentStage || !validStages.includes(currentStage)) {
    return false;
  }
  
  // Verificar que el usuario sea agente
  const userRole = useAuth().user?.role;
  if (userRole !== 'agent') {
    return false;
  }
  
  return true;
}, [opportunity, userRole]);
```

### 2. Agregar Botón de Solicitud

```typescript
// src/pages/OpportunityDetail.tsx

import { RequestHiringCodeModal } from '../components/opportunities/RequestHiringCodeModal';

export function OpportunityDetail({ opportunityId }: Props) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { data: opportunity } = useOpportunityDetail(opportunityId);
  const { data: contact } = useContact(opportunity?.contact_id);
  
  return (
    <div>
      {/* Contenido de la oportunidad */}
      
      {canRequestHiringCode && (
        <div className="mb-6">
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary"
          >
            Solicitar Código de Contratación
          </button>
        </div>
      )}
      
      <RequestHiringCodeModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        entityType="contacts"
        entityId={opportunity?.contact_id || ''}
        opportunity={opportunity}
        contact={contact}
        onSuccess={(response) => {
          // Actualizar oportunidad después del éxito
          queryClient.invalidateQueries(['opportunity', opportunityId]);
          setShowRequestModal(false);
        }}
      />
    </div>
  );
}
```

### 3. Crear Modal/Drawer

```typescript
// src/components/opportunities/RequestHiringCodeModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RequestHiringCodeForm } from './RequestHiringCodeForm';

export function RequestHiringCodeModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  opportunity,
  contact,
  onSuccess,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Código de Contratación</DialogTitle>
        </DialogHeader>
        
        <RequestHiringCodeForm
          entityType={entityType}
          entityId={entityId}
          opportunity={opportunity}
          contact={contact}
          onSuccess={(response) => {
            if (onSuccess) {
              onSuccess(response);
            }
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔐 Configuración de Permisos

### 1. Verificar Rol del Usuario

```typescript
// src/components/opportunities/RequestHiringCodeForm.tsx

import { useAuth } from '@/hooks/useAuth';

export function RequestHiringCodeForm(props: Props) {
  const { user } = useAuth();
  
  // Solo agentes pueden solicitar códigos
  if (user?.role !== 'agent') {
    return (
      <div className="text-center text-gray-500">
        Solo los agentes pueden solicitar códigos de contratación
      </div>
    );
  }
  
  // ... resto del componente
}
```

### 2. Verificar Permisos en el Backend

El backend ya valida que el usuario sea agente, pero es buena práctica validar también en el frontend para mejor UX.

---

## 🎨 Personalización

### 1. Personalizar Estilos

```typescript
// Usar clases de Tailwind o CSS personalizado
<form className="space-y-6 custom-hiring-code-form">
  {/* Campos del formulario */}
</form>
```

### 2. Personalizar Mensajes

```typescript
// src/config/messages.ts
export const hiringCodeMessages = {
  success: {
    title: 'Código Generado Exitosamente',
    message: 'El código de contratación ha sido generado y enviado al administrador',
    copyButton: 'Copiar Código',
  },
  error: {
    title: 'Error al Generar Código',
    message: 'No se pudo generar el código. Por favor, intente nuevamente',
  },
  validation: {
    signatureRequired: 'La firma del agente es requerida',
    serviceRequired: 'Debe seleccionar un servicio',
    pricingRequired: 'Debe especificar un precio',
  },
};
```

### 3. Personalizar Validaciones

```typescript
// Extender el schema de validación
const customHiringCodeSchema = hiringCodeSchema.extend({
  // Agregar validaciones personalizadas
  description: z.string().max(500, 'Descripción demasiado larga'),
});
```

---

## 🧪 Testing de Integración

### 1. Test del Componente

```typescript
// src/components/opportunities/__tests__/RequestHiringCodeForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestHiringCodeForm } from '../RequestHiringCodeForm';

describe('RequestHiringCodeForm', () => {
  it('renders form correctly', () => {
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />
    );
    
    expect(screen.getByLabelText(/firma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument();
  });
  
  it('validates required fields', async () => {
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/firma requerida/i)).toBeInTheDocument();
    });
  });
});
```

### 2. Test de Integración con API

```typescript
// src/components/opportunities/__tests__/RequestHiringCodeForm.integration.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestHiringCodeForm } from '../RequestHiringCodeForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('RequestHiringCodeForm Integration', () => {
  it('submits form and shows success', async () => {
    // Mock de API
    vi.mock('@/services/hiringCodeApi', () => ({
      hiringCodeApi: {
        request: vi.fn().mockResolvedValue({
          success: true,
          hiring_code: 'ABC12',
          email_sent: true,
        }),
      },
    }));
    
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />,
      { wrapper: createWrapper() }
    );
    
    // Completar formulario
    fireEvent.change(screen.getByLabelText(/firma/i), {
      target: { value: 'Juan Pérez' },
    });
    
    // ... completar otros campos
    
    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /solicitar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/código generado/i)).toBeInTheDocument();
      expect(screen.getByText('ABC12')).toBeInTheDocument();
    });
  });
});
```

---

## 🐛 Troubleshooting

### Problema: Error 401 Unauthorized

**Solución**:
1. Verificar que el token de autenticación esté presente
2. Verificar que el usuario tenga rol `agent`
3. Verificar que el interceptor de API esté configurado correctamente

### Problema: Error 400 Bad Request

**Solución**:
1. Verificar que todos los campos requeridos estén presentes
2. Verificar que `catalog_item_id` O `service_name` esté presente (no ambos)
3. Verificar que `amount` O `grade` esté presente (no ambos)
4. Verificar que si `payment_type === 'subscription'`, el `amount` sea divisible por 100

### Problema: Modal no se cierra después del éxito

**Solución**:
1. Verificar que `onSuccess` esté llamando a `onClose()`
2. Verificar que el estado del modal esté siendo actualizado correctamente
3. Verificar que no haya errores en la consola

### Problema: Datos no se pre-llenan desde oportunidad/contacto

**Solución**:
1. Verificar que `opportunity` y `contact` estén siendo pasados como props
2. Verificar que los campos en `defaultValues` coincidan con los nombres de los campos
3. Verificar que los datos estén disponibles cuando se renderiza el componente

---

## ✅ Checklist de Integración

- [ ] Dependencias instaladas
- [ ] Tipos TypeScript creados
- [ ] Servicio API creado
- [ ] Hook personalizado creado
- [ ] Componente RequestHiringCodeForm creado
- [ ] Modal/Drawer creado
- [ ] Integrado en OpportunityDetail
- [ ] Permisos configurados
- [ ] Validaciones funcionando
- [ ] Pre-llenado de datos funcionando
- [ ] Modal de éxito funcionando
- [ ] Copia al portapapeles funcionando
- [ ] Tests escritos
- [ ] Mobile responsive
- [ ] Accesibilidad verificada

---

## 📚 Referencias

- [Guía Técnica](FRONTEND_AGENT_HIRING_CODE_REQUEST_TECHNICAL.md)
- [Guía de Testing](FRONTEND_AGENT_HIRING_CODE_REQUEST_TESTING.md)
- [Quick Start](FRONTEND_AGENT_HIRING_CODE_REQUEST_QUICK_START.md)
- **Backend**: `docs/agent_hiring_code_request_system.md`

---

**Última actualización**: 2025-01-28
