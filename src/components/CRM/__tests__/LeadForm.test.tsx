import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadForm } from '@/components/CRM/LeadForm';

// Mock de servicios usando factory function
vi.mock('@/services/crmService', () => {
  return {
    crmService: {
      getPipelines: vi.fn(),
      getUsers: vi.fn(),
      getCompanies: vi.fn(),
      createLead: vi.fn(),
      updateLead: vi.fn(),
    },
  };
});

import { crmService } from '@/services/crmService';

const mockPipeline = {
  id: 1,
  name: 'Pipeline Principal',
  description: 'Pipeline por defecto',
  is_main: true,
  statuses: [
    { id: 1, name: 'Nuevo Lead', sort: 1, color: '#94A3B8', type: 0 },
    { id: 2, name: 'Contactado', sort: 2, color: '#3B82F6', type: 0 },
    { id: 3, name: 'Cliente', sort: 3, color: '#10B981', type: 1 },
  ],
};

const mockCRMUser = {
  id: 1,
  name: 'Admin Test',
  email: 'admin@test.com',
  role: 'admin',
  is_admin: true,
};

const mockCompanies = [
  {
    id: 1,
    name: 'Empresa Test',
    email: 'empresa@test.com',
    phone: '+34123456789',
  },
];

describe('LeadForm - Tests de Integración', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getPipelines).mockResolvedValue([mockPipeline]);
    vi.mocked(crmService.getUsers).mockResolvedValue([mockCRMUser]);
    vi.mocked(crmService.getCompanies).mockResolvedValue({ _embedded: { companies: mockCompanies } });
  });

  describe('Crear nuevo Lead', () => {
    it('debe renderizar todos los campos del formulario', async () => {
      render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/pipeline/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/responsable/i)).toBeInTheDocument();
      });
    });

    it('debe cargar pipelines y usuarios al montar el componente', async () => {
      render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(crmService.getPipelines).toHaveBeenCalled();
        expect(crmService.getUsers).toHaveBeenCalled();
      });
    });

    it('debe validar campos requeridos antes de enviar', async () => {
      const user = userEvent.setup();
      render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/crear lead/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /crear lead/i });
      await user.click(submitButton);

      // El formulario HTML5 debe prevenir el submit si faltan campos requeridos
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('debe enviar el formulario con datos válidos', async () => {
      const user = userEvent.setup();
      render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      });

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'Nuevo Lead Test');
      await user.type(screen.getByLabelText(/precio/i), '500');
      
      // Seleccionar pipeline (esperar a que se cargue)
      await waitFor(() => {
        const pipelineSelect = screen.getByLabelText(/pipeline/i);
        expect(pipelineSelect).toBeInTheDocument();
      });

      const pipelineSelect = screen.getByLabelText(/pipeline/i);
      await user.selectOptions(pipelineSelect, mockPipeline.id.toString());

      // Seleccionar estado
      await waitFor(() => {
        const statusSelect = screen.getByLabelText(/estado/i);
        expect(statusSelect).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/estado/i);
      await user.selectOptions(statusSelect, mockPipeline.statuses[0].id.toString());

      // Seleccionar responsable
      await waitFor(() => {
        const responsibleSelect = screen.getByLabelText(/responsable/i);
        expect(responsibleSelect).toBeInTheDocument();
      });

      const responsibleSelect = screen.getByLabelText(/responsable/i);
      await user.selectOptions(responsibleSelect, mockCRMUser.id.toString());

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: /crear lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.name).toBe('Nuevo Lead Test');
        expect(submittedData.price).toBe(500);
        expect(submittedData.pipeline_id).toBe(mockPipeline.id);
      });
    });

    it('debe llamar a onCancel cuando se presiona cancelar', async () => {
      const user = userEvent.setup();
      render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('debe mostrar estado de carga durante el submit', async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<LeadForm onSubmit={slowSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      });

      // Llenar formulario mínimo
      await user.type(screen.getByLabelText(/nombre/i), 'Test Lead');
      await user.type(screen.getByLabelText(/precio/i), '400');

      await waitFor(() => {
        const pipelineSelect = screen.getByLabelText(/pipeline/i);
        expect(pipelineSelect).toBeInTheDocument();
      });

      const pipelineSelect = screen.getByLabelText(/pipeline/i);
      await user.selectOptions(pipelineSelect, mockPipeline.id.toString());

      const statusSelect = screen.getByLabelText(/estado/i);
      await user.selectOptions(statusSelect, mockPipeline.statuses[0].id.toString());

      const responsibleSelect = screen.getByLabelText(/responsable/i);
      await user.selectOptions(responsibleSelect, mockCRMUser.id.toString());

      const submitButton = screen.getByRole('button', { name: /crear lead/i });
      await user.click(submitButton);

      // Verificar que el botón muestra estado de carga
      await waitFor(() => {
        expect(screen.getByText(/guardando/i)).toBeInTheDocument();
      });
    });
  });

  describe('Editar Lead existente', () => {
    it('debe prellenar el formulario con datos del lead existente', async () => {
      const existingLead = {
        ...mockPipeline,
        name: 'Lead Existente',
        price: 600,
        pipeline_id: mockPipeline.id,
        status_id: mockPipeline.statuses[0].id,
        responsible_user_id: mockCRMUser.id,
      };

      render(<LeadForm lead={existingLead} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Lead Existente');
      });

      expect(screen.getByText(/editar lead/i)).toBeInTheDocument();
    });
  });
});

