# 🚀 Quick Start - Solicitud de Código de Contratación

**Fecha**: 2025-01-28  
**Módulo**: Frontend - CRM Opportunities  
**Tiempo estimado**: 20 minutos

---

## ⚡ Inicio Rápido

### 1. Instalar Dependencias (2 min)

```bash
npm install react-hook-form zod @hookform/resolvers lucide-react
# o
yarn add react-hook-form zod @hookform/resolvers lucide-react
```

### 2. Crear Tipos TypeScript (3 min)

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
  // ... otros campos opcionales
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

### 3. Crear Servicio API (3 min)

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

### 4. Crear Hook Personalizado (2 min)

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
  });
}
```

### 5. Crear Componente Básico (5 min)

```typescript
// src/components/opportunities/RequestHiringCodeForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  agent_signature: z.string().min(3),
  contract_template: z.string().min(1),
  service_name: z.string().optional(),
  amount: z.number().positive().optional(),
  // ... más campos
});

export function RequestHiringCodeForm({
  entityType,
  entityId,
  onSuccess,
}: Props) {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  const mutation = useRequestHiringCode();
  
  const onSubmit = async (data: any) => {
    const result = await mutation.mutateAsync({
      entityType,
      entityId,
      data,
    });
    
    if (onSuccess) {
      onSuccess(result);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('agent_signature')} />
      <input {...form.register('service_name')} />
      <input {...form.register('amount', { valueAsNumber: true })} />
      <button type="submit">Solicitar Código</button>
    </form>
  );
}
```

### 6. Integrar en OpportunityDetail (5 min)

```typescript
// src/pages/OpportunityDetail.tsx
import { RequestHiringCodeForm } from '../components/opportunities/RequestHiringCodeForm';

export function OpportunityDetail({ opportunityId }: Props) {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowForm(true)}>
        Solicitar Código de Contratación
      </button>
      
      {showForm && (
        <RequestHiringCodeForm
          entityType="contacts"
          entityId={opportunity?.contact_id}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## 📝 Ejemplo Mínimo Completo

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RequestHiringCodeForm } from './components/opportunities/RequestHiringCodeForm';

function OpportunityDetail({ opportunityId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { data: opportunity } = useOpportunityDetail(opportunityId);
  
  return (
    <div>
      {opportunity && (
        <button onClick={() => setShowForm(true)}>
          Solicitar Código
        </button>
      )}
      
      {showForm && (
        <RequestHiringCodeForm
          entityType="contacts"
          entityId={opportunity?.contact_id}
          opportunity={opportunity}
          onSuccess={(response) => {
            console.log('Código:', response.hiring_code);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## ✅ Verificación Rápida

1. ✅ Dependencias instaladas
2. ✅ Tipos TypeScript creados
3. ✅ Servicio API creado
4. ✅ Hook personalizado creado
5. ✅ Componente básico creado
6. ✅ Integrado en OpportunityDetail
7. ✅ Formulario se renderiza
8. ✅ Validación funciona
9. ✅ Envío funciona
10. ✅ Código se muestra después del éxito

---

## 🐛 Problemas Comunes

### Error: "Cannot find module 'react-hook-form'"
**Solución**: `npm install react-hook-form zod @hookform/resolvers`

### Error: "API 401 Unauthorized"
**Solución**: Verificar que el token de autenticación esté configurado

### Error: "Validation failed"
**Solución**: Verificar que todos los campos requeridos estén completos

### Error: "Service or pricing required"
**Solución**: Debe seleccionar un servicio Y especificar un precio

---

## 📚 Documentación Completa

- [Resumen](FRONTEND_AGENT_HIRING_CODE_REQUEST_SUMMARY.md)
- [Guía Técnica](FRONTEND_AGENT_HIRING_CODE_REQUEST_TECHNICAL.md)
- [Guía de Integración](FRONTEND_AGENT_HIRING_CODE_REQUEST_INTEGRATION.md)
- [Guía de Testing](FRONTEND_AGENT_HIRING_CODE_REQUEST_TESTING.md)

---

**Última actualización**: 2025-01-28
