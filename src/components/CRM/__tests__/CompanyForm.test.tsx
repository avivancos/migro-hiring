import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CompanyForm } from '@/components/CRM/CompanyForm';

// Mock de crmService usando factory function
vi.mock('@/services/crmService', () => {
  const mockGetResponsibleUsers = vi.fn();
  
  return {
    crmService: {
      getResponsibleUsers: mockGetResponsibleUsers,
    },
  };
});

// Mock de adminService
vi.mock('@/services/adminService', () => ({
  adminService: {
    getUser: vi.fn(() => ({ id: 'user-1', email: 'admin@test.com' })),
  },
}));

import { crmService } from '@/services/crmService';

describe('CompanyForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getResponsibleUsers).mockResolvedValue([
      { id: 'user-1', name: 'Admin Test', email: 'admin@test.com' },
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

  it('debe guardar todos los campos al editar una empresa', async () => {
    // Crear una empresa existente con todos los campos completos
    const existingCompany: any = {
      id: 'company-1',
      name: 'Empresa Original SL',
      email: 'contacto@original.com',
      phone: '+34123456789',
      website: 'https://www.original.com',
      industry: 'Tecnología',
      responsible_user_id: 'user-1',
      country: 'España',
      city: 'Madrid',
      address: 'Calle Principal 123',
      description: 'Descripción original de la empresa',
    };

    const { container } = render(
      <CompanyForm 
        company={existingCompany} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    // Esperar a que el formulario cargue los datos de la empresa
    await waitFor(() => {
      expect(screen.getByDisplayValue('Empresa Original SL')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar algunos campos para verificar que se guardan los cambios
    const nameInput = screen.getByLabelText(/nombre.*empresa/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);
    const websiteInput = screen.getByLabelText(/sitio web/i);
    const industryInput = screen.getByLabelText(/industria/i);
    const cityInput = screen.queryByLabelText(/ciudad/i);
    const addressInput = screen.queryByLabelText(/dirección/i);
    const descriptionTextarea = screen.queryByLabelText(/descripción/i);

    fireEvent.change(nameInput, { target: { value: 'Empresa Actualizada SL' } });
    fireEvent.change(emailInput, { target: { value: 'nuevo@actualizada.com' } });
    fireEvent.change(phoneInput, { target: { value: '+34987654321' } });
    fireEvent.change(websiteInput, { target: { value: 'https://www.actualizada.com' } });
    fireEvent.change(industryInput, { target: { value: 'Retail' } });

    if (cityInput) {
      fireEvent.change(cityInput, { target: { value: 'Barcelona' } });
    }

    if (addressInput) {
      fireEvent.change(addressInput, { target: { value: 'Calle Actualizada 456' } });
    }

    if (descriptionTextarea) {
      fireEvent.change(descriptionTextarea, { target: { value: 'Descripción actualizada de la empresa' } });
    }

    // Modificar responsable
    const responsibleSelect = screen.queryByLabelText(/responsable/i);
    if (responsibleSelect) {
      await waitFor(() => {
        expect(responsibleSelect).toBeInTheDocument();
      }, { container });
      fireEvent.change(responsibleSelect, { target: { value: 'user-1' } });
    }

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /actualizar/i }) || screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitButton);

    // Verificar que onSubmit fue llamado con todos los campos
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    }, { container, timeout: 5000 });

    const submittedData = mockOnSubmit.mock.calls[0][0];

    // Verificar campos básicos
    expect(submittedData).toHaveProperty('name', 'Empresa Actualizada SL');
    expect(submittedData).toHaveProperty('email', 'nuevo@actualizada.com');
    expect(submittedData).toHaveProperty('phone', '+34987654321');
    expect(submittedData).toHaveProperty('website', 'https://www.actualizada.com');
    expect(submittedData).toHaveProperty('industry', 'Retail');

    // Verificar que todos los campos esperados están presentes
    const expectedFields = [
      'name', 'email', 'phone', 'website', 'industry',
      'country', 'responsible_user_id'
    ];

    expectedFields.forEach(field => {
      expect(submittedData).toHaveProperty(field, expect.anything());
    });

    // Verificar que los campos modificados se guardaron correctamente
    expect(submittedData.name).toBe('Empresa Actualizada SL');
    expect(submittedData.email).toBe('nuevo@actualizada.com');
    expect(submittedData.phone).toBe('+34987654321');
    expect(submittedData.website).toBe('https://www.actualizada.com');
    expect(submittedData.industry).toBe('Retail');
  });
});
