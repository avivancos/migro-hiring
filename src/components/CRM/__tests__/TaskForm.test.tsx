import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TaskForm } from '@/components/CRM/TaskForm';

// Mock de window.alert si se necesita
global.alert = vi.fn();

// Mock de crmService usando factory function
vi.mock('@/services/crmService', () => {
  const mockGetResponsibleUsers = vi.fn();
  const mockGetContact = vi.fn();
  
  return {
    crmService: {
      getResponsibleUsers: mockGetResponsibleUsers,
      getContact: mockGetContact,
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

describe('TaskForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear el mock para que devuelva una Promise resuelta
    mockOnSubmit.mockResolvedValue(undefined);
    vi.mocked(crmService.getResponsibleUsers).mockResolvedValue([
      { id: 'user-1', name: 'Admin Test', email: 'admin@test.com' },
    ]);
    vi.mocked(crmService.getContact).mockResolvedValue({
      id: 'contact-1',
      name: 'Contacto Test',
      email: 'contacto@test.com',
    });
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
    }, { container, timeout: 3000 });

    const descriptionInput = screen.getByLabelText(/descripción/i);
    fireEvent.change(descriptionInput, { target: { value: 'Llamar al cliente' } });

    // Esperar a que el responsable se cargue
    const responsibleSelect = await screen.findByLabelText(/responsable/i, {}, { timeout: 3000 });
    expect(responsibleSelect).toBeInTheDocument();
    
    // Seleccionar responsable (usando el ID correcto del mock)
    fireEvent.change(responsibleSelect, { target: { value: 'user-1' } });

    const submitButton = screen.getByRole('button', { name: /crear tarea/i });
    
    // Verificar que el botón está habilitado antes de hacer click
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);

    // Esperar a que se llame onSubmit con un timeout mayor
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    }, { container, timeout: 8000 });

    // Verificar que onSubmit fue llamado con los datos correctos
    expect(mockOnSubmit.mock.calls.length).toBeGreaterThan(0);
    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData).toHaveProperty('text', 'Llamar al cliente');
    expect(submittedData).toHaveProperty('entity_type', 'contacts');
    expect(submittedData).toHaveProperty('entity_id', '1');
    expect(submittedData).toHaveProperty('responsible_user_id', 'user-1');
  }, 10000); // Timeout del test completo: 10 segundos

  it('debe guardar todos los campos al editar una tarea', async () => {
    // Crear una tarea existente con todos los campos completos
    const existingTask: any = {
      id: 'task-1',
      text: 'Tarea original - Llamar al cliente',
      task_type: 'call',
      entity_type: 'contacts',
      entity_id: 'contact-1',
      responsible_user_id: 'user-1',
      complete_till: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
      task_template_id: 'template-1',
      result_text: 'Resultado original de la tarea',
    };

    const { container } = render(
      <TaskForm 
        task={existingTask} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    // Esperar a que el formulario cargue los datos de la tarea
    await waitFor(() => {
      expect(screen.getByDisplayValue('Tarea original - Llamar al cliente')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar algunos campos para verificar que se guardan los cambios
    const textTextarea = screen.getByLabelText(/descripción/i);
    const taskTypeSelect = screen.getByLabelText(/tipo/i);
    const entityTypeSelect = screen.queryByLabelText(/entidad/i);

    fireEvent.change(textTextarea, { target: { value: 'Tarea actualizada - Reunión con cliente' } });
    fireEvent.change(taskTypeSelect, { target: { value: 'meeting' } });

    // Modificar fecha usando el ID específico
    const dateInput = screen.getByLabelText(/fecha de vencimiento/i) || document.getElementById('complete_till');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateString = tomorrow.toISOString().slice(0, 16);
      fireEvent.change(dateInput, { target: { value: dateString } });
    }

    // Modificar responsable si está disponible
    const responsibleSelect = screen.queryByLabelText(/responsable/i);
    if (responsibleSelect) {
      await waitFor(() => {
        expect(responsibleSelect).toBeInTheDocument();
      }, { container });
      fireEvent.change(responsibleSelect, { target: { value: 'user-1' } });
    }

    // Modificar resultado si hay campo de resultado
    const resultTextarea = screen.queryByLabelText(/resultado/i);
    if (resultTextarea) {
      fireEvent.change(resultTextarea, { target: { value: 'Resultado actualizado de la tarea' } });
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
    expect(submittedData).toHaveProperty('text');
    expect(submittedData.text).toContain('Tarea actualizada');
    expect(submittedData).toHaveProperty('task_type', 'meeting');
    expect(submittedData).toHaveProperty('entity_type', 'contacts');
    expect(submittedData).toHaveProperty('entity_id', 'contact-1');
    expect(submittedData).toHaveProperty('responsible_user_id');
    expect(submittedData).toHaveProperty('complete_till');
    
    // Verificar que complete_till es una fecha ISO válida
    expect(submittedData.complete_till).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verificar que todos los campos esperados están presentes
    const expectedFields = [
      'text', 'task_type', 'entity_type', 'entity_id',
      'responsible_user_id', 'complete_till'
    ];

    expectedFields.forEach(field => {
      expect(submittedData).toHaveProperty(field, expect.anything());
    });
  });
});
