import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    const { container } = render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe validar que el nombre es requerido', async () => {
    const { container } = render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear empresa/i })).toBeInTheDocument();
    }, { container });

    const submitButton = screen.getByRole('button', { name: /crear empresa/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { container });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
    }, { container });

    const nameInput = screen.getByLabelText(/nombre.*empresa/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(nameInput, { target: { value: 'Nueva Empresa SL' } });
    fireEvent.change(emailInput, { target: { value: 'contacto@empresa.com' } });

    const submitButton = screen.getByRole('button', { name: /crear empresa/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nueva Empresa SL',
          email: 'contacto@empresa.com',
        })
      );
    }, { container, timeout: 3000 });
  });
});
