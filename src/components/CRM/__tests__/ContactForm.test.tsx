import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe validar que el nombre es requerido', async () => {
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contacto/i })).toBeInTheDocument();
    }, { container });

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { container });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    }, { container });

    const nameInput = screen.getByLabelText(/nombre/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(nameInput, { target: { value: 'María' } });
    fireEvent.change(emailInput, { target: { value: 'maria@test.com' } });

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'María',
          email: 'maria@test.com',
        })
      );
    }, { container, timeout: 3000 });
  });
});
