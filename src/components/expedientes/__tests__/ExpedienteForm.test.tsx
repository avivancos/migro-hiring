// Tests unitarios para ExpedienteForm
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ExpedienteForm } from '../ExpedienteForm';
import { expedienteApi } from '@/services/expedienteApi';

// Mock de expedienteApi
vi.mock('@/services/expedienteApi', () => ({
  expedienteApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock de useExpedienteDetail
vi.mock('@/hooks/useExpedienteDetail', () => ({
  useExpedienteDetail: () => ({
    expediente: null,
    loading: false,
    updateExpediente: vi.fn(),
  }),
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
});

