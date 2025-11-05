import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/components/CRM/ContactForm';

// Mock de crmService usando factory function
vi.mock('@/services/crmService', () => {
  const mockGetCompanies = vi.fn();
  
  return {
    crmService: {
      getCompanies: mockGetCompanies,
    },
  };
});

import { crmService } from '@/services/crmService';

describe('ContactForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getCompanies).mockResolvedValue({
      _embedded: {
        companies: [
          { id: 1, name: 'Empresa Test', email: 'empresa@test.com' },
        ],
      },
    });
  });

  it('debe renderizar el formulario', async () => {
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('debe validar que el nombre es requerido', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contacto/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'María');
    await user.type(screen.getByLabelText(/email/i), 'maria@test.com');

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'María',
          email: 'maria@test.com',
        })
      );
    });
  });
});
