import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyForm } from '@/components/CRM/CompanyForm';
import { mockCrmService, mockCompanies, mockCRMUser } from '@/test/mockData';

vi.mock('@/services/crmService', () => ({
  crmService: mockCrmService,
}));

describe('CompanyForm - Tests de Integración', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCrmService.getUsers.mockResolvedValue([mockCRMUser]);
  });

  describe('Crear nueva Empresa', () => {
    it('debe renderizar todos los campos del formulario', async () => {
      render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument();
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

      // El formulario HTML5 debe prevenir el submit si falta el nombre
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

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre.*empresa/i), 'Nueva Empresa SL');
      await user.type(screen.getByLabelText(/email/i), 'contacto@empresa.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+34123456789');
      await user.type(screen.getByLabelText(/sitio web/i), 'https://www.empresa.com');

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: /crear empresa/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.name).toBe('Nueva Empresa SL');
        expect(submittedData.email).toBe('contacto@empresa.com');
        expect(submittedData.phone).toBe('+34123456789');
        expect(submittedData.website).toBe('https://www.empresa.com');
      });
    });

    it('debe validar formato de URL en sitio web', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre.*empresa/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nombre.*empresa/i), 'Test');
      await user.type(screen.getByLabelText(/sitio web/i), 'no-es-una-url');

      const websiteInput = screen.getByLabelText(/sitio web/i) as HTMLInputElement;
      expect(websiteInput.validity.valid).toBe(false);
    });

    it('debe llamar a onCancel cuando se presiona cancelar', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Editar Empresa existente', () => {
    it('debe prellenar el formulario con datos de la empresa existente', async () => {
      const existingCompany = {
        id: 1,
        name: 'Empresa Existente',
        email: 'info@existente.com',
        phone: '+34123456789',
      };

      render(<CompanyForm company={existingCompany} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nombre.*empresa/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Empresa Existente');
      });

      expect(screen.getByText(/editar empresa/i)).toBeInTheDocument();
    });
  });
});

