# 🧪 Guía de Testing - Componentes Tipo Servicio

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Oportunidades CRM  
**Versión**: 1.0.0

---

## 📋 Índice

1. [Setup de Testing](#setup-de-testing)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Accessibility Tests](#accessibility-tests)
5. [Mobile Tests](#mobile-tests)
6. [E2E Tests](#e2e-tests)
7. [Performance Tests](#performance-tests)

---

## 🛠️ Setup de Testing

### Dependencias Necesarias

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/react-hooks": "^8.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@axe-core/react": "^4.8.0",
    "jest-axe": "^7.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Configuración de Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

### Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

---

## 🔬 Unit Tests

### TipoServicioSelector

```typescript
// src/components/opportunities/__tests__/TipoServicioSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TipoServicioSelector } from '../TipoServicioSelector';

describe('TipoServicioSelector', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });
  
  it('renders correctly', () => {
    render(<TipoServicioSelector onChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  
  it('opens dropdown when clicked', async () => {
    render(<TipoServicioSelector onChange={mockOnChange} />);
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
  
  it('filters services when searching', async () => {
    render(<TipoServicioSelector onChange={mockOnChange} />);
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(searchInput, 'asilo');
    
    await waitFor(() => {
      const items = screen.getAllByRole('option');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveTextContent(/asilo/i);
    });
  });
  
  it('calls onChange when service is selected', async () => {
    render(<TipoServicioSelector onChange={mockOnChange} />);
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    const firstOption = screen.getAllByRole('option')[0];
    await userEvent.click(firstOption);
    
    expect(mockOnChange).toHaveBeenCalled();
  });
  
  it('validates nacionalidad for asilo service', async () => {
    render(
      <TipoServicioSelector
        onChange={mockOnChange}
        nacionalidad="colombia"
      />
    );
    
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    // Asilo solo debería estar disponible para "sin_papeles"
    const asiloOption = screen.queryByRole('option', { name: /asilo/i });
    expect(asiloOption).not.toBeInTheDocument();
  });
  
  it('closes on Escape key', async () => {
    render(<TipoServicioSelector onChange={mockOnChange} />);
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    await userEvent.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
```

### FirstCallSummary

```typescript
// src/components/opportunities/__tests__/FirstCallSummary.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirstCallSummary } from '../FirstCallSummary';

describe('FirstCallSummary', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSave.mockClear();
  });
  
  it('renders textarea', () => {
    render(<FirstCallSummary value="" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('shows character count', () => {
    const value = 'Test summary';
    render(<FirstCallSummary value={value} onChange={mockOnChange} />);
    expect(screen.getByText(`${value.length} caracteres`)).toBeInTheDocument();
  });
  
  it('validates minimum length', () => {
    const value = 'Short';
    render(
      <FirstCallSummary
        value={value}
        onChange={mockOnChange}
        minLength={50}
      />
    );
    
    expect(screen.getByText(/mínimo/i)).toBeInTheDocument();
  });
  
  it('validates maximum length', () => {
    const value = 'A'.repeat(1001);
    render(
      <FirstCallSummary
        value={value}
        onChange={mockOnChange}
        maxLength={1000}
      />
    );
    
    expect(screen.getByText(/máximo/i)).toBeInTheDocument();
  });
  
  it('auto-resizes textarea', () => {
    const { container } = render(
      <FirstCallSummary value="" onChange={mockOnChange} />
    );
    
    const textarea = screen.getByRole('textbox');
    const initialHeight = textarea.style.height;
    
    fireEvent.change(textarea, {
      target: { value: 'A'.repeat(100) }
    });
    
    expect(textarea.style.height).not.toBe(initialHeight);
  });
  
  it('calls onSave when auto-save is enabled', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(
      <FirstCallSummary
        value=""
        onChange={mockOnChange}
        onSave={mockOnSave}
        autoSave={true}
        autoSaveDelay={100}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Test summary with enough characters');
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    }, { timeout: 500 });
  });
  
  it('shows saving indicator', async () => {
    mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <FirstCallSummary
        value="Test"
        onChange={mockOnChange}
        onSave={mockOnSave}
        autoSave={true}
        autoSaveDelay={50}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/guardando/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🔗 Integration Tests

### OpportunityTipoServicioSection

```typescript
// src/components/opportunities/__tests__/OpportunityTipoServicioSection.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunityTipoServicioSection } from '../OpportunityTipoServicioSection';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('OpportunityTipoServicioSection', () => {
  const mockOnSave = vi.fn();
  
  beforeEach(() => {
    mockOnSave.mockClear();
  });
  
  it('renders both components', () => {
    render(
      <OpportunityTipoServicioSection
        opportunityId="123"
        onSave={mockOnSave}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText(/tipo de servicio/i)).toBeInTheDocument();
    expect(screen.getByText(/resumen/i)).toBeInTheDocument();
  });
  
  it('saves both values together', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(
      <OpportunityTipoServicioSection
        opportunityId="123"
        onSave={mockOnSave}
      />,
      { wrapper: createWrapper() }
    );
    
    // Seleccionar tipo de servicio
    const tipoButton = screen.getByRole('combobox', { name: /tipo/i });
    await userEvent.click(tipoButton);
    
    await waitFor(() => {
      const option = screen.getAllByRole('option')[0];
      return userEvent.click(option);
    });
    
    // Escribir resumen
    const summaryTextarea = screen.getByRole('textbox');
    await userEvent.type(summaryTextarea, 'Test summary');
    
    // Guardar
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        tipoServicio: expect.any(String),
        summary: 'Test summary',
      });
    });
  });
});
```

---

## ♿ Accessibility Tests

### Con jest-axe

```typescript
// src/components/opportunities/__tests__/TipoServicioSelector.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TipoServicioSelector } from '../TipoServicioSelector';

expect.extend(toHaveNoViolations);

describe('TipoServicioSelector Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <TipoServicioSelector onChange={() => {}} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has proper ARIA labels', () => {
    const { container } = render(
      <TipoServicioSelector
        onChange={() => {}}
        aria-label="Seleccionar tipo de servicio"
      />
    );
    
    const combobox = container.querySelector('[role="combobox"]');
    expect(combobox).toHaveAttribute('aria-label', 'Seleccionar tipo de servicio');
  });
  
  it('announces selection to screen readers', async () => {
    const { container } = render(
      <TipoServicioSelector onChange={() => {}} />
    );
    
    // Simular selección
    // Verificar que hay un anuncio para screen readers
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });
});
```

### Con @axe-core/react

```typescript
import { axe } from '@axe-core/react';

it('should pass axe accessibility tests', async () => {
  const { container } = render(<TipoServicioSelector onChange={() => {}} />);
  
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
```

---

## 📱 Mobile Tests

### Test de Bottom Sheet

```typescript
// src/components/opportunities/__tests__/TipoServicioSelector.mobile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock de useMediaQuery
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true, // Siempre mobile
}));

describe('TipoServicioSelector Mobile', () => {
  it('shows bottom sheet on mobile', async () => {
    render(<TipoServicioSelector onChange={() => {}} />);
    
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    await waitFor(() => {
      const bottomSheet = screen.getByRole('dialog');
      expect(bottomSheet).toBeInTheDocument();
      expect(bottomSheet).toHaveClass('bottom-sheet');
    });
  });
  
  it('prevents body scroll when open', async () => {
    render(<TipoServicioSelector onChange={() => {}} />);
    
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });
  
  it('closes bottom sheet on overlay click', async () => {
    render(<TipoServicioSelector onChange={() => {}} />);
    
    const button = screen.getByRole('combobox');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const overlay = document.querySelector('.bottom-sheet-overlay');
    await userEvent.click(overlay!);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
```

---

## 🎭 E2E Tests

### Con Playwright

```typescript
// e2e/tipo-servicio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tipo Servicio Components', () => {
  test.beforeEach(async ({ page }) => {
    // Login y navegar a oportunidad
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.goto('/crm/opportunities/123');
  });
  
  test('selects tipo servicio', async ({ page }) => {
    // Abrir selector
    await page.click('[role="combobox"]');
    
    // Buscar servicio
    await page.fill('input[placeholder*="buscar"]', 'asilo');
    
    // Seleccionar
    await page.click('[role="option"]:first-child');
    
    // Verificar selección
    await expect(page.locator('[role="combobox"]')).toContainText('asilo');
  });
  
  test('saves summary', async ({ page }) => {
    // Escribir resumen
    const textarea = page.locator('textarea');
    await textarea.fill('Test summary with enough characters');
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar guardado
    await expect(page.locator('[role="status"]')).toContainText('guardado');
  });
  
  test('validates summary length', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Short');
    
    // Verificar mensaje de error
    await expect(page.locator('text=/mínimo/i')).toBeVisible();
  });
});
```

---

## ⚡ Performance Tests

### Test de Renderizado

```typescript
// src/components/opportunities/__tests__/TipoServicioSelector.perf.test.tsx
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('TipoServicioSelector Performance', () => {
  it('renders within acceptable time', () => {
    const start = performance.now();
    
    render(<TipoServicioSelector onChange={() => {}} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(100); // < 100ms
  });
  
  it('handles large service lists efficiently', async () => {
    const services = Array.from({ length: 1000 }, (_, i) => ({
      code: `service-${i}`,
      name: `Service ${i}`,
      category: 'Category',
    }));
    
    const start = performance.now();
    
    render(
      <TipoServicioSelector
        onChange={() => {}}
        services={services}
      />
    );
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(500); // < 500ms para 1000 items
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
# o
yarn test:coverage
```

---

## ✅ Checklist de Testing

- [ ] Unit tests para cada componente
- [ ] Integration tests para flujos completos
- [ ] Accessibility tests (axe)
- [ ] Mobile tests (bottom sheet, touch)
- [ ] Keyboard navigation tests
- [ ] Screen reader tests
- [ ] E2E tests con Playwright
- [ ] Performance tests
- [ ] Coverage > 80%
- [ ] Tests en CI/CD

---

**Última actualización**: 2025-01-28
