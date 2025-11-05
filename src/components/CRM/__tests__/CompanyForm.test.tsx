import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyForm } from '@/components/CRM/CompanyForm';

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

describe('CompanyForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getUsers).mockResolvedValue([
      { id: 1, name: 'Admin Test', email: 'admin@test.com' },
    ]);
  });

  it('debe renderizar el formulario', async () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
    });
  });

  it('debe validar que el nombre es requerido', async () => {
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear empresa/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /crear empresa/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre.*empresa/i), 'Nueva Empresa SL');
    await user.type(screen.getByLabelText(/email/i), 'contacto@empresa.com');

    const submitButton = screen.getByRole('button', { name: /crear empresa/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nueva Empresa SL',
          email: 'contacto@empresa.com',
        })
      );
    });
  });
});
