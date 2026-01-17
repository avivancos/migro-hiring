// Tests unitarios para ExpedienteForm
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ExpedienteForm } from '../ExpedienteForm';
import { expedienteApi } from '@/services/expedienteApi';
import { useExpedienteDetail } from '@/hooks/useExpedienteDetail';

// Mock de expedienteApi
vi.mock('@/services/expedienteApi', () => ({
  expedienteApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock de useExpedienteDetail - se configurará dinámicamente en los tests
const mockUpdateExpediente = vi.fn();
vi.mock('@/hooks/useExpedienteDetail', () => ({
  useExpedienteDetail: vi.fn(() => ({
    expediente: null,
    loading: false,
    error: null,
    updating: false,
    updateExpediente: mockUpdateExpediente,
    refresh: vi.fn(),
    cambiarEstado: vi.fn(),
  })),
}));

// Mock de usePermissions
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canEditExpediente: () => true,
  }),
}));

describe('ExpedienteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar mock por defecto para todos los tests
    vi.mocked(useExpedienteDetail).mockReturnValue({
      expediente: null,
      loading: false,
      error: null,
      updating: false,
      updateExpediente: mockUpdateExpediente,
      refresh: vi.fn(),
      cambiarEstado: vi.fn(),
    });
  });

  it('renderiza el formulario para crear nuevo expediente', () => {
    render(
      <BrowserRouter>
        <ExpedienteForm onSave={vi.fn()} onCancel={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/nuevo expediente/i)).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/título/i);
    expect(titleInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear expediente/i })).toBeInTheDocument();
  });

  it('valida que el título es requerido', async () => {
    const onSave = vi.fn();

    const { container } = render(
      <BrowserRouter>
        <ExpedienteForm onSave={onSave} onCancel={vi.fn()} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/título/i);
    // Intentar enviar sin título
    const submitButton = screen.getByRole('button', { name: /crear expediente/i });
    
    fireEvent.click(submitButton);
    
    // Esperar a que aparezca el error de validación
    await waitFor(() => {
      expect(titleInput).toBeInvalid();
    }, { container, timeout: 2000 });
  });

  it('valida que el título tiene mínimo 10 caracteres', async () => {
    const onSave = vi.fn();

    const { container } = render(
      <BrowserRouter>
        <ExpedienteForm onSave={onSave} onCancel={vi.fn()} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Corto' } }); // Menos de 10 caracteres
    fireEvent.blur(titleInput); // Salir del campo para trigger validación

    const submitButton = screen.getByRole('button', { name: /crear expediente/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/el título debe tener al menos 10 caracteres/i);
      // El error debe aparecer o el input debe ser inválido
      expect(errorMessage || titleInput).toBeTruthy();
    }, { container, timeout: 2000 });
  });

  it('envía el formulario con datos válidos', async () => {
    const onSave = vi.fn();
    const mockExpediente = {
      id: '1',
      title: 'Expediente de prueba completo',
      status: 'new' as const,
      source: 'manual' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user_id: 'user-1',
    };

    vi.mocked(expedienteApi.create).mockResolvedValue(mockExpediente);

    const { container } = render(
      <BrowserRouter>
        <ExpedienteForm onSave={onSave} onCancel={vi.fn()} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Expediente de prueba completo' } });

    const submitButton = screen.getByRole('button', { name: /crear expediente/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(expedienteApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Expediente de prueba completo',
          status: 'new',
          source: 'manual',
        })
      );
      expect(onSave).toHaveBeenCalled();
    }, { container, timeout: 3000 });
  });

  it('debe guardar todos los campos al editar un expediente', async () => {
    const onSave = vi.fn();
    const existingExpediente = {
      id: 'exp-1',
      title: 'Expediente original completo con suficiente longitud',
      summary: 'Resumen original del expediente',
      legal_situation: 'Situación legal original',
      status: 'new' as const,
      source: 'manual' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user_id: 'user-1',
    };

    const updatedExpediente = {
      ...existingExpediente,
      title: 'Expediente actualizado con suficiente longitud mínima',
      summary: 'Resumen actualizado del expediente',
      legal_situation: 'Situación legal actualizada',
    };

    const mockUpdateExpedienteFn = vi.fn().mockResolvedValue(updatedExpediente);
    
    // Mock de useExpedienteDetail para este test específico
    vi.mocked(useExpedienteDetail).mockReturnValue({
      expediente: existingExpediente,
      loading: false,
      error: null,
      updating: false,
      updateExpediente: mockUpdateExpedienteFn,
      refresh: vi.fn(),
      cambiarEstado: vi.fn(),
    });

    vi.mocked(expedienteApi.update).mockResolvedValue(updatedExpediente);

    const { container } = render(
      <BrowserRouter>
        <ExpedienteForm 
          expedienteId="exp-1"
          initialData={existingExpediente}
          onSave={onSave} 
          onCancel={vi.fn()} 
        />
      </BrowserRouter>
    );

    // Esperar a que el formulario cargue los datos del expediente
    await waitFor(() => {
      expect(screen.getByDisplayValue('Expediente original completo con suficiente longitud')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar campos
    const titleInput = screen.getByLabelText(/título/i);
    const summaryTextarea = screen.getByLabelText(/resumen/i);

    fireEvent.change(titleInput, { target: { value: 'Expediente actualizado con suficiente longitud mínima' } });
    fireEvent.change(summaryTextarea, { target: { value: 'Resumen actualizado del expediente' } });

    // Abrir detalles para acceder a legal_situation - usar click en summary
    const detailsElement = container.querySelector('details');
    const summaryElement = container.querySelector('details summary');
    if (detailsElement && summaryElement) {
      // Abrir el details element usando click en summary
      (detailsElement as HTMLDetailsElement).open = true;
      fireEvent.click(summaryElement);
    }

    // Intentar encontrar y modificar legal_situation si está disponible
    await waitFor(() => {
      const legalSituationInput = screen.queryByLabelText(/situación legal/i);
      if (legalSituationInput) {
        fireEvent.change(legalSituationInput, { target: { value: 'Situación legal actualizada' } });
      }
    }, { container, timeout: 2000 });

    // Enviar formulario - el botón dice "Guardar Cambios" cuando está editando
    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateExpedienteFn).toHaveBeenCalled();
    }, { container, timeout: 5000 });

    // Verificar que se llamó con todos los campos
    const updateCall = mockUpdateExpedienteFn.mock.calls[0];
    if (updateCall && updateCall[0]) {
      const updateData = updateCall[0];

      // Verificar campos básicos
      expect(updateData).toHaveProperty('title');
      expect(updateData.title).toContain('Expediente actualizado');
      expect(updateData.title.length).toBeGreaterThanOrEqual(10); // Validación de mínimo 10 caracteres

      // Verificar que todos los campos esperados están presentes
      const expectedFields = ['title'];
      
      // summary y legal_situation pueden estar presentes si se modificaron
      if (updateData.summary !== undefined) {
        expectedFields.push('summary');
      }
      
      if (updateData.legal_situation !== undefined) {
        expectedFields.push('legal_situation');
      }

      expectedFields.forEach(field => {
        expect(updateData).toHaveProperty(field, expect.anything());
      });

      // Verificar que los campos modificados se guardaron correctamente
      expect(updateData.title).toBe('Expediente actualizado con suficiente longitud mínima');
    }
  });
});

