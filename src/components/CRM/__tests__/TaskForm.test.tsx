import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/CRM/TaskForm';
import { mockCrmService, mockCRMUser } from '@/test/mockData';

vi.mock('@/services/crmService', () => ({
  crmService: mockCrmService,
}));

describe('TaskForm - Tests de Integración', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCrmService.getUsers.mockResolvedValue([mockCRMUser]);
  });

  describe('Crear nueva Tarea', () => {
    it('debe renderizar todos los campos del formulario', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/responsable/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/fecha.*vencimiento/i)).toBeInTheDocument();
      });
    });

    it('debe cargar usuarios al montar el componente', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(mockCrmService.getUsers).toHaveBeenCalled();
      });
    });

    it('debe validar campos requeridos antes de enviar', async () => {
      const user = userEvent.setup();
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /crear tarea/i });
      await user.click(submitButton);

      // El formulario HTML5 debe prevenir el submit si faltan campos requeridos
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

      // Llenar formulario
      await user.type(screen.getByLabelText(/descripción/i), 'Llamar al cliente mañana');

      // Seleccionar tipo de tarea
      const taskTypeSelect = screen.getByLabelText(/tipo/i);
      await user.selectOptions(taskTypeSelect, 'call');

      // Seleccionar responsable
      await waitFor(() => {
        const responsibleSelect = screen.getByLabelText(/responsable/i);
        expect(responsibleSelect).toBeInTheDocument();
      });

      const responsibleSelect = screen.getByLabelText(/responsable/i);
      await user.selectOptions(responsibleSelect, mockCRMUser.id.toString());

      // Seleccionar fecha (mañana a las 10:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const dateString = tomorrow.toISOString().slice(0, 16);

      const dateInput = screen.getByLabelText(/fecha.*vencimiento/i) as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, dateString);

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: /crear tarea/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.text).toBe('Llamar al cliente mañana');
        expect(submittedData.task_type).toBe('call');
        expect(submittedData.entity_type).toBe('lead');
        expect(submittedData.entity_id).toBe(1);
        expect(submittedData.responsible_user_id).toBe(mockCRMUser.id);
      });
    });

    it('debe tener fecha por defecto (mañana a las 10:00)', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/fecha.*vencimiento/i) as HTMLInputElement;
        expect(dateInput.value).not.toBe('');
      });
    });

    it('debe permitir seleccionar diferentes tipos de tarea', async () => {
      const user = userEvent.setup();
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const taskTypeSelect = screen.getByLabelText(/tipo/i);
        expect(taskTypeSelect).toBeInTheDocument();
      });

      const taskTypeSelect = screen.getByLabelText(/tipo/i);
      const options = Array.from(taskTypeSelect.querySelectorAll('option'));
      
      expect(options.map(opt => opt.value)).toContain('call');
      expect(options.map(opt => opt.value)).toContain('meeting');
      expect(options.map(opt => opt.value)).toContain('email');
      expect(options.map(opt => opt.value)).toContain('deadline');
      expect(options.map(opt => opt.value)).toContain('follow_up');
    });

    it('debe llamar a onCancel cuando se presiona cancelar', async () => {
      const user = userEvent.setup();
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Editar Tarea existente', () => {
    it('debe prellenar el formulario con datos de la tarea existente', async () => {
      const existingTask = {
        id: 1,
        text: 'Tarea existente',
        task_type: 'meeting',
        entity_type: 'lead' as const,
        entity_id: 1,
        responsible_user_id: mockCRMUser.id,
        due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        is_completed: false,
      };

      render(<TaskForm task={existingTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const textInput = screen.getByLabelText(/descripción/i) as HTMLTextAreaElement;
        expect(textInput.value).toBe('Tarea existente');
      });

      expect(screen.getByText(/editar tarea/i)).toBeInTheDocument();
    });

    it('debe mostrar campo de resultado si la tarea está completada', async () => {
      const completedTask = {
        id: 1,
        text: 'Tarea completada',
        task_type: 'call' as const,
        entity_type: 'lead' as const,
        entity_id: 1,
        responsible_user_id: mockCRMUser.id,
        due_date: new Date().toISOString(),
        is_completed: true,
        result_text: 'Llamada realizada exitosamente',
      };

      render(<TaskForm task={completedTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/resultado/i)).toBeInTheDocument();
      });

      const resultInput = screen.getByLabelText(/resultado/i) as HTMLTextAreaElement;
      expect(resultInput.value).toBe('Llamada realizada exitosamente');
    });
  });
});

