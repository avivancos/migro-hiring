# 🧪 Guía de Testing - Solicitud de Código de Contratación

**Fecha**: 2025-01-28  
**Módulo**: Frontend - CRM Opportunities  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Setup de Testing](#setup-de-testing)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Accessibility Tests](#accessibility-tests)

---

## 🛠️ Setup de Testing

### Dependencias

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^1.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Mock de API

```typescript
// src/test/mocks/hiringCodeApi.ts
import { vi } from 'vitest';

export const mockHiringCodeApi = {
  request: vi.fn().mockResolvedValue({
    success: true,
    message: 'Código generado exitosamente',
    hiring_code: 'ABC12',
    hiring_code_id: null,
    pipeline_stage_id: 'pipeline-123',
    email_sent: true,
  }),
};
```

---

## 🔬 Unit Tests

### RequestHiringCodeForm

```typescript
// src/components/opportunities/__tests__/RequestHiringCodeForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestHiringCodeForm } from '../RequestHiringCodeForm';

describe('RequestHiringCodeForm', () => {
  const defaultProps = {
    entityType: 'contacts' as const,
    entityId: 'contact-123',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders form fields', () => {
    render(<RequestHiringCodeForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/firma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
  });
  
  it('validates required signature', async () => {
    render(<RequestHiringCodeForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/firma requerida/i)).toBeInTheDocument();
    });
  });
  
  it('validates service selection', async () => {
    render(<RequestHiringCodeForm {...defaultProps} />);
    
    // Completar firma pero no servicio
    await userEvent.type(
      screen.getByLabelText(/firma/i),
      'Juan Pérez'
    );
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/servicio requerido/i)).toBeInTheDocument();
    });
  });
  
  it('validates pricing selection', async () => {
    render(<RequestHiringCodeForm {...defaultProps} />);
    
    // Completar firma y servicio pero no precio
    await userEvent.type(
      screen.getByLabelText(/firma/i),
      'Juan Pérez'
    );
    await userEvent.type(
      screen.getByLabelText(/nombre del servicio/i),
      'Servicio de prueba'
    );
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/precio requerido/i)).toBeInTheDocument();
    });
  });
  
  it('validates subscription amount divisibility', async () => {
    render(<RequestHiringCodeForm {...defaultProps} />);
    
    // Seleccionar suscripción con monto no divisible por 100
    await userEvent.type(
      screen.getByLabelText(/firma/i),
      'Juan Pérez'
    );
    await userEvent.type(
      screen.getByLabelText(/nombre del servicio/i),
      'Servicio de prueba'
    );
    await userEvent.type(
      screen.getByLabelText(/monto/i),
      '150' // No divisible por 100
    );
    
    const paymentTypeSelect = screen.getByLabelText(/tipo de pago/i);
    await userEvent.selectOptions(paymentTypeSelect, 'subscription');
    
    await waitFor(() => {
      expect(
        screen.getByText(/divisible por 100/i)
      ).toBeInTheDocument();
    });
  });
  
  it('pre-fills data from opportunity', () => {
    const opportunity = {
      tipo_servicio: 'nacionalidad',
      tipo_servicio_especificacion: 'Por residencia',
    };
    
    render(
      <RequestHiringCodeForm
        {...defaultProps}
        opportunity={opportunity}
      />
    );
    
    expect(screen.getByDisplayValue('nacionalidad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Por residencia')).toBeInTheDocument();
  });
  
  it('pre-fills data from contact', () => {
    const contact = {
      full_name: 'Juan Pérez',
      email: 'juan@example.com',
      nie: 'X1234567Y',
    };
    
    render(
      <RequestHiringCodeForm
        {...defaultProps}
        contact={contact}
      />
    );
    
    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument();
  });
});
```

### HiringCodeSuccessModal

```typescript
// src/components/opportunities/__tests__/HiringCodeSuccessModal.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HiringCodeSuccessModal } from '../HiringCodeSuccessModal';

describe('HiringCodeSuccessModal', () => {
  it('displays hiring code', () => {
    render(
      <HiringCodeSuccessModal
        hiringCode="ABC12"
        isOpen={true}
        onClose={() => {}}
      />
    );
    
    expect(screen.getByText('ABC12')).toBeInTheDocument();
  });
  
  it('copies code to clipboard', async () => {
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText },
    });
    
    render(
      <HiringCodeSuccessModal
        hiringCode="ABC12"
        isOpen={true}
        onClose={() => {}}
      />
    );
    
    const copyButton = screen.getByRole('button', { name: /copiar/i });
    await userEvent.click(copyButton);
    
    expect(writeText).toHaveBeenCalledWith('ABC12');
    expect(screen.getByText(/copiado/i)).toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    
    render(
      <HiringCodeSuccessModal
        hiringCode="ABC12"
        isOpen={true}
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

## 🔗 Integration Tests

### Form Submission Flow

```typescript
// src/components/opportunities/__tests__/RequestHiringCodeForm.integration.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestHiringCodeForm } from '../RequestHiringCodeForm';
import { hiringCodeApi } from '@/services/hiringCodeApi';

vi.mock('@/services/hiringCodeApi');

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
  beforeEach(() => {
    vi.mocked(hiringCodeApi.request).mockResolvedValue({
      success: true,
      message: 'Código generado exitosamente',
      hiring_code: 'ABC12',
      hiring_code_id: null,
      pipeline_stage_id: 'pipeline-123',
      email_sent: true,
    });
  });
  
  it('submits form successfully', async () => {
    const onSuccess = vi.fn();
    
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="contact-123"
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() }
    );
    
    // Completar formulario
    await userEvent.type(
      screen.getByLabelText(/firma/i),
      'Juan Pérez'
    );
    await userEvent.type(
      screen.getByLabelText(/nombre del servicio/i),
      'Servicio de prueba'
    );
    await userEvent.type(
      screen.getByLabelText(/monto/i),
      '400'
    );
    
    // Enviar
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(hiringCodeApi.request).toHaveBeenCalledWith({
        entityType: 'contacts',
        entityId: 'contact-123',
        data: expect.objectContaining({
          agent_signature: 'Juan Pérez',
          service_name: 'Servicio de prueba',
          amount: 40000, // En centavos
        }),
      });
    });
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles API errors', async () => {
    vi.mocked(hiringCodeApi.request).mockRejectedValue(
      new Error('Error al solicitar código')
    );
    
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="contact-123"
      />,
      { wrapper: createWrapper() }
    );
    
    // Completar y enviar formulario
    await userEvent.type(
      screen.getByLabelText(/firma/i),
      'Juan Pérez'
    );
    // ... completar otros campos
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎭 E2E Tests

### Con Playwright

```typescript
// e2e/request-hiring-code.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Request Hiring Code', () => {
  test.beforeEach(async ({ page }) => {
    // Login como agente
    await page.goto('/login');
    await page.fill('[name="email"]', 'agent@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Navegar a oportunidad
    await page.goto('/crm/opportunities/123');
  });
  
  test('solicits hiring code successfully', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Solicitar Código")');
    
    // Completar formulario
    await page.fill('[name="agent_signature"]', 'Juan Pérez');
    await page.fill('[name="service_name"]', 'Servicio de prueba');
    await page.fill('[name="amount"]', '400');
    
    // Enviar
    await page.click('button:has-text("Solicitar Código")');
    
    // Verificar éxito
    await expect(page.locator('text=/código generado/i')).toBeVisible();
    await expect(page.locator('text=/ABC/i')).toBeVisible();
  });
  
  test('validates required fields', async ({ page }) => {
    await page.click('button:has-text("Solicitar Código")');
    await page.click('button:has-text("Solicitar Código")');
    
    await expect(page.locator('text=/firma requerida/i')).toBeVisible();
  });
  
  test('copies code to clipboard', async ({ page }) => {
    // ... completar formulario y enviar
    
    await page.click('button:has-text("Copiar Código")');
    
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^[A-Z0-9]+$/);
  });
});
```

---

## ♿ Accessibility Tests

### Con jest-axe

```typescript
// src/components/opportunities/__tests__/RequestHiringCodeForm.a11y.test.tsx

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RequestHiringCodeForm } from '../RequestHiringCodeForm';

expect.extend(toHaveNoViolations);

describe('RequestHiringCodeForm Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has proper labels', () => {
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />
    );
    
    expect(screen.getByLabelText(/firma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument();
  });
  
  it('announces errors to screen readers', async () => {
    render(
      <RequestHiringCodeForm
        entityType="contacts"
        entityId="123"
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /solicitar/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toBeInTheDocument();
    });
  });
});
```

---

## 📊 Coverage Goals

### Cobertura Objetivo

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Comando de Coverage

```bash
npm run test:coverage
```

---

## ✅ Checklist de Testing

- [ ] Unit tests para RequestHiringCodeForm
- [ ] Unit tests para HiringCodeSuccessModal
- [ ] Integration tests para flujo completo
- [ ] E2E tests con Playwright
- [ ] Accessibility tests (axe)
- [ ] Tests de validación
- [ ] Tests de pre-llenado de datos
- [ ] Tests de manejo de errores
- [ ] Tests de copia al portapapeles
- [ ] Coverage > 80%

---

**Última actualización**: 2025-01-28
