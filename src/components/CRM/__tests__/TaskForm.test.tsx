import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TaskForm } from '@/components/CRM/TaskForm';

// Mock de crmService usando factory function
vi.mock('@/services/crmService', () => {
  const mockGetUsers = vi.fn();
  
  return {
    crmService: {
      getUsers: mockGetUsers,
    },
  };
});

import { crmService } from '@/services/crmService';

describe('TaskForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getUsers).mockResolvedValue([
      { id: 1, name: 'Admin Test', email: 'admin@test.com' },
    ]);
  });

  it('debe renderizar el formulario', async () => {
    const { container } = render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="contacts" defaultEntityId="1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe validar campos requeridos', async () => {
    const { container } = render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="contacts" defaultEntityId="1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
    }, { container });

    const submitButton = screen.getByRole('button', { name: /crear tarea/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { container });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="contacts" defaultEntityId="1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    }, { container });

    const descriptionInput = screen.getByLabelText(/descripción/i);
    fireEvent.change(descriptionInput, { target: { value: 'Llamar al cliente' } });

    const responsibleSelect = screen.getByLabelText(/responsable/i);
    await waitFor(() => {
      expect(responsibleSelect).toBeInTheDocument();
    }, { container });
    fireEvent.change(responsibleSelect, { target: { value: '1' } });

    const submitButton = screen.getByRole('button', { name: /crear tarea/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Llamar al cliente',
          entity_type: 'contacts',
          entity_id: 1,
        })
      );
    }, { container, timeout: 3000 });
  });
});
