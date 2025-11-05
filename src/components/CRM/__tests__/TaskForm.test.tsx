import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="lead" defaultEntityId={1} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });
  });

  it('debe validar campos requeridos', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="lead" defaultEntityId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /crear tarea/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultEntityType="lead" defaultEntityId={1} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/descripción/i), 'Llamar al cliente');

    const responsibleSelect = screen.getByLabelText(/responsable/i);
    await waitFor(() => {
      expect(responsibleSelect).toBeInTheDocument();
    });
    await user.selectOptions(responsibleSelect, '1');

    const submitButton = screen.getByRole('button', { name: /crear tarea/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Llamar al cliente',
          entity_type: 'lead',
          entity_id: 1,
        })
      );
    });
  });
});
