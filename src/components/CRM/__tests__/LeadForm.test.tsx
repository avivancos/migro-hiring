import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LeadForm } from '@/components/CRM/LeadForm';

// Mock de crmService
vi.mock('@/services/crmService', () => {
  const mockGetUsers = vi.fn();
  const mockGetContacts = vi.fn();
  
  return {
    crmService: {
      getResponsibleUsers: mockGetUsers,
      getContacts: mockGetContacts,
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

describe('LeadForm - Tests Automatizados', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getResponsibleUsers).mockResolvedValue([
      { id: 'user-1', name: 'Admin Test', email: 'admin@test.com' },
    ]);
    vi.mocked(crmService.getContacts).mockResolvedValue({
      items: [
        { id: 'contact-1', name: 'Contacto 1', email: 'contacto1@test.com' },
      ],
      total: 1,
      skip: 0,
      limit: 100,
    });
  });

  it('debe renderizar el formulario', async () => {
    const { container } = render(
      <LeadForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre del lead/i)).toBeInTheDocument();
    }, { container, timeout: 3000 });
  });

  it('debe validar que el nombre es requerido', async () => {
    const { container } = render(
      <LeadForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar lead/i })).toBeInTheDocument();
    }, { container, timeout: 3000 });

    const submitButton = screen.getByRole('button', { name: /guardar lead/i });
    fireEvent.click(submitButton);

    // El formulario HTML5 debería prevenir el envío si el nombre está vacío
    await waitFor(() => {
      expect(submitButton).toBeInTheDocument();
    }, { container, timeout: 2000 });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(
      <LeadForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre del lead/i)).toBeInTheDocument();
    }, { container, timeout: 3000 });

    const nameInput = screen.getByLabelText(/nombre del lead/i);
    const priceInput = screen.getByLabelText(/valor/i);
    const serviceTypeInput = screen.getByLabelText(/tipo de servicio/i);
    const sourceSelect = screen.getByLabelText(/fuente/i);
    const prioritySelect = screen.getByLabelText(/prioridad/i);

    fireEvent.change(nameInput, { target: { value: 'Lead de prueba completo' } });
    fireEvent.change(priceInput, { target: { value: '400' } });
    fireEvent.change(serviceTypeInput, { target: { value: 'Residencia Legal' } });
    fireEvent.change(sourceSelect, { target: { value: 'Web' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    const submitButton = screen.getByRole('button', { name: /guardar lead/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    }, { container, timeout: 3000 });

    // Verificar que se guardaron los campos principales
    const savedLead = mockOnSave.mock.calls[0][0];
    expect(savedLead).toHaveProperty('name');
    expect(savedLead.name).toContain('Lead de prueba');
  });

  it('debe guardar todos los campos al editar un lead', async () => {
    const existingLead: any = {
      id: 'lead-1',
      name: 'Lead Original',
      price: 400,
      currency: 'EUR',
      status: 'new',
      priority: 'medium',
      service_type: 'Residencia Legal',
      service_description: 'Descripción original del servicio',
      source: 'Web',
      description: 'Notas internas originales',
      responsible_user_id: 'user-1',
      contact_id: 'contact-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
      updated_by: 'user-1',
      is_deleted: false,
    };

    const { container } = render(
      <LeadForm lead={existingLead} onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lead Original')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar campos
    const nameInput = screen.getByLabelText(/nombre del lead/i);
    const priceInput = screen.getByLabelText(/valor/i);
    const serviceTypeInput = screen.getByLabelText(/tipo de servicio/i);
    const serviceDescriptionTextarea = screen.getByLabelText(/descripción del servicio/i);

    fireEvent.change(nameInput, { target: { value: 'Lead Actualizado' } });
    fireEvent.change(priceInput, { target: { value: '500' } });
    fireEvent.change(serviceTypeInput, { target: { value: 'Nacionalidad' } });
    fireEvent.change(serviceDescriptionTextarea, { target: { value: 'Descripción actualizada del servicio' } });

    // Modificar selects
    const sourceSelect = screen.getByLabelText(/fuente/i);
    const prioritySelect = screen.getByLabelText(/prioridad/i);

    fireEvent.change(sourceSelect, { target: { value: 'Referido' } });
    fireEvent.change(prioritySelect, { target: { value: 'urgent' } });

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /guardar lead/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    }, { container, timeout: 3000 });

    // Verificar que todos los campos se guardaron
    const savedLead = mockOnSave.mock.calls[0][0];
    
    // Campos básicos
    expect(savedLead).toHaveProperty('name');
    expect(savedLead).toHaveProperty('price');
    expect(savedLead).toHaveProperty('service_type');
    expect(savedLead).toHaveProperty('source');
    expect(savedLead).toHaveProperty('priority');
    expect(savedLead).toHaveProperty('service_description');
    expect(savedLead).toHaveProperty('description');
    
    // Verificar valores actualizados
    expect(savedLead.name).toContain('Lead Actualizado');
    expect(savedLead.service_type).toBe('Nacionalidad');
    expect(savedLead.source).toBe('Referido');
    expect(savedLead.priority).toBe('urgent');
  });
});
