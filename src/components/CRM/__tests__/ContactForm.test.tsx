import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/components/CRM/ContactForm';
import { mockCrmService, mockCompanies, mockCRMUser } from '../../test/mockData';

vi.mock('@/services/crmService', () => ({
  crmService: mockCrmService,
}));

describe('ContactForm - Tests de Integración', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCrmService.getCompanies.mockResolvedValue({ _embedded: { companies: mockCompanies } });
  });

  describe('Crear nuevo Contacto', () => {
    it('debe renderizar todos los campos del formulario', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
      });
    });

    it('debe cargar empresas al montar el componente', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(mockCrmService.getCompanies).toHaveBeenCalled();
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

      // El formulario HTML5 debe prevenir el submit si falta el nombre
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

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'María');
      await user.type(screen.getByLabelText(/apellido/i), 'García');
      await user.type(screen.getByLabelText(/email/i), 'maria@test.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+34123456789');

      // Seleccionar empresa
      await waitFor(() => {
        const companySelect = screen.getByLabelText(/empresa/i);
        expect(companySelect).toBeInTheDocument();
      });

      const companySelect = screen.getByLabelText(/empresa/i);
      await user.selectOptions(companySelect, mockCompanies[0].id.toString());

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: /crear contacto/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.first_name).toBe('María');
        expect(submittedData.last_name).toBe('García');
        expect(submittedData.email).toBe('maria@test.com');
        expect(submittedData.phone).toBe('+34123456789');
        expect(submittedData.company_id).toBe(mockCompanies[0].id);
      });
    });

    it('debe validar formato de email', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nombre/i), 'Test');
      await user.type(screen.getByLabelText(/email/i), 'email-invalido');

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.validity.valid).toBe(false);
    });

    it('debe llamar a onCancel cuando se presiona cancelar', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Editar Contacto existente', () => {
    it('debe prellenar el formulario con datos del contacto existente', async () => {
      const existingContact = {
        id: 1,
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@test.com',
        phone: '+34123456789',
        company_id: mockCompanies[0].id,
      };

      render(<ContactForm contact={existingContact} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Juan');
      });

      expect(screen.getByText(/editar contacto/i)).toBeInTheDocument();
    });
  });
});

