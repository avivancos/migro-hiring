# 📘 Guía Técnica - Solicitud de Código de Contratación para Agentes

**Fecha**: 2025-01-28  
**Módulo**: Frontend - CRM Opportunities  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Arquitectura del Componente](#arquitectura-del-componente)
2. [Tipos TypeScript](#tipos-typescript)
3. [Estructura del Formulario](#estructura-del-formulario)
4. [Validaciones](#validaciones)
5. [Manejo de Estado](#manejo-de-estado)
6. [Integración con API](#integración-con-api)
7. [Optimizaciones](#optimizaciones)

---

## 🏗️ Arquitectura del Componente

### Estructura de Archivos

```
src/components/opportunities/
├── RequestHiringCodeForm.tsx          # Componente principal del formulario
├── RequestHiringCodeModal.tsx         # Modal/Drawer para mobile
├── HiringCodeSuccessModal.tsx         # Modal de éxito con código
└── __tests__/
    ├── RequestHiringCodeForm.test.tsx
    └── RequestHiringCodeModal.test.tsx
```

### Dependencias

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-hook-form": "^7.45.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "lucide-react": "^0.263.1"
  }
}
```

---

## 📝 Tipos TypeScript

### Request Body

```typescript
// src/types/hiringCode.ts

export interface AgentHiringCodeRequest {
  // Requeridos
  agent_signature: string;
  contract_template: string;
  
  // Servicio (uno de estos)
  catalog_item_id?: number;
  service_name?: string;
  
  // Precio (uno de estos)
  amount?: number; // En centavos
  grade?: 'A' | 'B' | 'C' | 'T';
  
  // Opcionales
  currency?: string; // Default: "EUR"
  expires_in_days?: number; // Default: 30, range: 1-365
  description?: string;
  payment_type?: 'one_time' | 'subscription'; // Default: "one_time"
  
  // Información del cliente
  client_name?: string;
  client_email?: string;
  client_passport?: string;
  client_nie?: string;
  client_nationality?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  
  // Tipo de servicio
  tipo_servicio?: string;
  tipo_servicio_especificacion?: string;
  
  // Pago manual
  manual_payment_note?: string;
  manual_payment_method?: string;
  manual_payment_confirmed?: boolean;
}
```

### Response

```typescript
export interface AgentHiringCodeResponse {
  success: boolean;
  message: string;
  hiring_code: string;
  hiring_code_id: null;
  pipeline_stage_id: string;
  email_sent: boolean;
}
```

### Props del Componente

```typescript
export interface RequestHiringCodeFormProps {
  entityType: 'contacts' | 'leads';
  entityId: string;
  opportunity?: LeadOpportunity;
  contact?: CRMContact;
  onSuccess?: (response: AgentHiringCodeResponse) => void;
  onCancel?: () => void;
  className?: string;
}
```

---

## 📋 Estructura del Formulario

### Componente Principal

```typescript
// src/components/opportunities/RequestHiringCodeForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validación
const hiringCodeSchema = z.object({
  agent_signature: z.string().min(3, 'Firma debe tener al menos 3 caracteres'),
  contract_template: z.string().min(1, 'Plantilla requerida'),
  
  // Servicio: catalog_item_id O service_name
  catalog_item_id: z.number().optional(),
  service_name: z.string().optional(),
  
  // Precio: amount O grade (no ambos)
  amount: z.number().positive().optional(),
  grade: z.enum(['A', 'B', 'C', 'T']).optional(),
  
  payment_type: z.enum(['one_time', 'subscription']).default('one_time'),
  expires_in_days: z.number().min(1).max(365).default(30),
  currency: z.string().default('EUR'),
  
  // ... otros campos
}).refine(
  (data) => data.catalog_item_id || data.service_name,
  {
    message: 'Debe seleccionar un servicio del catálogo o escribir el nombre',
    path: ['service_info'],
  }
).refine(
  (data) => data.amount || data.grade,
  {
    message: 'Debe especificar un monto o seleccionar el grado',
    path: ['pricing'],
  }
).refine(
  (data) => !(data.amount && data.grade),
  {
    message: 'No puede especificar monto y grado simultáneamente',
    path: ['pricing_both'],
  }
).refine(
  (data) => {
    if (data.payment_type === 'subscription' && data.amount) {
      return data.amount % 100 === 0;
    }
    return true;
  },
  {
    message: 'Para suscripción, el monto debe ser divisible por 100',
    path: ['amount'],
  }
);

export function RequestHiringCodeForm({
  entityType,
  entityId,
  opportunity,
  contact,
  onSuccess,
  onCancel,
}: RequestHiringCodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<AgentHiringCodeRequest>({
    resolver: zodResolver(hiringCodeSchema),
    defaultValues: {
      contract_template: 'standard',
      payment_type: 'one_time',
      expires_in_days: 30,
      currency: 'EUR',
      // Pre-llenar desde oportunidad
      tipo_servicio: opportunity?.tipo_servicio,
      tipo_servicio_especificacion: opportunity?.tipo_servicio_especificacion,
      // Pre-llenar desde contacto
      client_name: contact?.full_name || contact?.name,
      client_email: contact?.email,
      client_nie: contact?.nie,
      client_passport: contact?.passport,
      client_nationality: contact?.nacionalidad,
      client_address: contact?.address,
      client_city: contact?.city,
      client_province: contact?.province,
      client_postal_code: contact?.postal_code,
    },
  });

  const paymentType = form.watch('payment_type');
  const catalogItemId = form.watch('catalog_item_id');
  const amount = form.watch('amount');
  const grade = form.watch('grade');

  const onSubmit = async (data: AgentHiringCodeRequest) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await hiringCodeApi.request({
        entityType,
        entityId,
        data,
      });
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar código');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Secciones del formulario */}
    </form>
  );
}
```

### Sección 1: Firma del Agente

```typescript
<div>
  <Label htmlFor="agent_signature">
    Firma Digital del Agente *
  </Label>
  <Input
    id="agent_signature"
    {...form.register('agent_signature')}
    placeholder="Nombre completo del agente"
    error={form.formState.errors.agent_signature?.message}
  />
  <p className="text-sm text-gray-500">
    Confirma con tu firma que la situación está completada
  </p>
</div>
```

### Sección 2: Tipo de Servicio

```typescript
<div>
  <Label>Tipo de Servicio *</Label>
  
  {/* Opción 1: Catálogo */}
  <div>
    <Label htmlFor="catalog_item_id">Seleccionar del catálogo</Label>
    <Select
      id="catalog_item_id"
      {...form.register('catalog_item_id', { valueAsNumber: true })}
      disabled={!!form.watch('service_name')}
    >
      <option value="">Seleccionar servicio...</option>
      {catalogItems.map(item => (
        <option key={item.id} value={item.id}>
          {item.name} - {formatPrice(item.price)}
        </option>
      ))}
    </Select>
  </div>
  
  <div className="text-center text-sm text-gray-500">o</div>
  
  {/* Opción 2: Texto libre */}
  <div>
    <Label htmlFor="service_name">Nombre del servicio (texto libre)</Label>
    <Input
      id="service_name"
      {...form.register('service_name')}
      placeholder="Ej: Consultoría migratoria personalizada"
      disabled={!!form.watch('catalog_item_id')}
    />
  </div>
</div>
```

### Sección 3: Precio

```typescript
<div>
  <Label>Precio *</Label>
  
  <div className="space-y-4">
    {/* Opción 1: Monto fijo */}
    <div>
      <Label htmlFor="amount">
        <input
          type="radio"
          {...form.register('pricing_method')}
          value="amount"
          checked={!grade}
          onChange={() => {
            form.setValue('grade', undefined);
            form.setValue('amount', undefined);
          }}
        />
        Monto fijo
      </Label>
      <Input
        type="number"
        id="amount"
        {...form.register('amount', { valueAsNumber: true })}
        placeholder="Monto en euros"
        disabled={!!grade}
        min={0}
        step={0.01}
      />
      {paymentType === 'subscription' && amount && amount % 100 !== 0 && (
        <p className="text-sm text-red-500">
          Para suscripción, el monto debe ser divisible por 100
        </p>
      )}
    </div>
    
    {/* Opción 2: Por grado */}
    <div>
      <Label htmlFor="grade">
        <input
          type="radio"
          {...form.register('pricing_method')}
          value="grade"
          checked={!amount}
          onChange={() => {
            form.setValue('amount', undefined);
            form.setValue('grade', undefined);
          }}
        />
        Por grado del cliente
      </Label>
      <Select
        id="grade"
        {...form.register('grade')}
        disabled={!!amount}
      >
        <option value="">Seleccionar grado...</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="T">T</option>
      </Select>
      {grade && (
        <p className="text-sm text-gray-500">
          El precio se calculará según el grado seleccionado
        </p>
      )}
    </div>
  </div>
</div>
```

### Sección 4: Configuración del Contrato

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="contract_template">Plantilla del Contrato *</Label>
    <Select
      id="contract_template"
      {...form.register('contract_template')}
    >
      <option value="standard">Standard</option>
      <option value="premium">Premium</option>
    </Select>
  </div>
  
  <div>
    <Label htmlFor="payment_type">Tipo de Pago</Label>
    <Select
      id="payment_type"
      {...form.register('payment_type')}
    >
      <option value="one_time">Pago único (2 pagos)</option>
      <option value="subscription">Suscripción (10 pagos)</option>
    </Select>
  </div>
  
  <div>
    <Label htmlFor="expires_in_days">Expira en (días)</Label>
    <Input
      type="number"
      id="expires_in_days"
      {...form.register('expires_in_days', { valueAsNumber: true })}
      min={1}
      max={365}
    />
  </div>
</div>
```

---

## ✅ Validaciones

### Validación con Zod

```typescript
const hiringCodeSchema = z.object({
  agent_signature: z.string()
    .min(3, 'Firma debe tener al menos 3 caracteres')
    .max(100, 'Firma demasiado larga'),
  
  contract_template: z.string().min(1, 'Plantilla requerida'),
  
  // Validación condicional: catalog_item_id O service_name
  catalog_item_id: z.number().positive().optional(),
  service_name: z.string().min(1).optional(),
  
  // Validación condicional: amount O grade (no ambos)
  amount: z.number()
    .positive('Monto debe ser positivo')
    .optional(),
  grade: z.enum(['A', 'B', 'C', 'T']).optional(),
  
  payment_type: z.enum(['one_time', 'subscription']),
  
  // Validación para subscription
}).superRefine((data, ctx) => {
  // Validar servicio
  if (!data.catalog_item_id && !data.service_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe seleccionar un servicio del catálogo o escribir el nombre',
      path: ['service_info'],
    });
  }
  
  // Validar precio
  if (!data.amount && !data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe especificar un monto o seleccionar el grado',
      path: ['pricing'],
    });
  }
  
  // Validar que no sean ambos
  if (data.amount && data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No puede especificar monto y grado simultáneamente',
      path: ['pricing_both'],
    });
  }
  
  // Validar subscription
  if (data.payment_type === 'subscription' && data.amount) {
    if (data.amount % 100 !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para suscripción, el monto debe ser divisible por 100',
        path: ['amount'],
      });
    }
  }
});
```

### Validación en Tiempo Real

```typescript
// Validar al perder foco
const handleBlur = (field: keyof AgentHiringCodeRequest) => {
  form.trigger(field);
};

// Validar al cambiar valores relacionados
useEffect(() => {
  if (paymentType === 'subscription' && amount) {
    form.trigger('amount');
  }
}, [paymentType, amount]);
```

---

## 🔄 Manejo de Estado

### Estados del Componente

```typescript
type FormState = 
  | 'idle'           // Inicial, listo para completar
  | 'filling'        // Usuario completando campos
  | 'validating'     // Validación en tiempo real
  | 'submitting'     // Enviando solicitud
  | 'success'        // Código generado exitosamente
  | 'error';         // Error en la solicitud

const [formState, setFormState] = useState<FormState>('idle');
const [result, setResult] = useState<AgentHiringCodeResponse | null>(null);
const [error, setError] = useState<string | null>(null);
```

### Transiciones de Estado

```typescript
const handleSubmit = async (data: AgentHiringCodeRequest) => {
  setFormState('submitting');
  setError(null);
  
  try {
    const response = await hiringCodeApi.request({
      entityType,
      entityId,
      data,
    });
    
    setResult(response);
    setFormState('success');
    
    if (onSuccess) {
      onSuccess(response);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error desconocido');
    setFormState('error');
  }
};
```

---

## 🔌 Integración con API

### Servicio API

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

### Hook Personalizado

```typescript
// src/hooks/useRequestHiringCode.ts

import { useMutation } from '@tanstack/react-query';
import { hiringCodeApi } from '../services/hiringCodeApi';

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

---

## ⚡ Optimizaciones

### 1. Lazy Loading del Catálogo

```typescript
const { data: catalogItems, isLoading } = useQuery({
  queryKey: ['catalog', 'items'],
  queryFn: () => catalogApi.list(),
  enabled: !form.watch('service_name'), // Solo cargar si no hay texto libre
});
```

### 2. Debounce en Validación

```typescript
const debouncedValidate = useDebounce(
  () => form.trigger(),
  500
);

useEffect(() => {
  if (form.formState.isDirty) {
    debouncedValidate();
  }
}, [form.watch()]);
```

### 3. Memoización de Componentes

```typescript
const ServiceSelector = memo(({ form }: { form: UseFormReturn }) => {
  // Componente memoizado
});

const PricingSelector = memo(({ form }: { form: UseFormReturn }) => {
  // Componente memoizado
});
```

---

## 🎨 Modal de Éxito

```typescript
// src/components/opportunities/HiringCodeSuccessModal.tsx

export function HiringCodeSuccessModal({
  hiringCode,
  isOpen,
  onClose,
}: {
  hiringCode: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(hiringCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          Código Generado Exitosamente
        </h2>
        <p className="text-gray-600 mb-6">
          Email enviado al administrador
        </p>
        
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-500 mb-2">Código de Contratación</p>
          <p className="text-3xl font-mono font-bold">{hiringCode}</p>
        </div>
        
        <button
          onClick={handleCopy}
          className="btn-primary mb-4"
        >
          {copied ? '✓ Copiado' : 'Copiar Código'}
        </button>
        
        <button onClick={onClose} className="btn-secondary">
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
```

---

**Última actualización**: 2025-01-28
