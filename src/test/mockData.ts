// Mock data para tests de formularios CRM
import { vi } from 'vitest';

export const mockPipeline: any = {
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

export const mockCRMUser: any = {
  id: 1,
  name: 'Admin Test',
  email: 'admin@test.com',
  role: 'admin',
  is_admin: true,
};

export const mockCompanies: any[] = [
  {
    id: 1,
    name: 'Empresa Test',
    email: 'empresa@test.com',
    phone: '+34123456789',
  },
];

export const mockContact: any = {
  id: 1,
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@test.com',
  phone: '+34123456789',
};

export const mockLead: any = {
  id: 1,
  name: 'Test Lead',
  price: 400,
  currency: 'EUR',
  pipeline_id: 1,
  status_id: 1,
  responsible_user_id: 1,
  priority: 'medium',
};

export const mockTask: any = {
  id: 1,
  text: 'Test Task',
  task_type: 'call',
  entity_type: 'lead',
  entity_id: 1,
  responsible_user_id: 1,
  due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  is_completed: false,
};

// Mock de servicios
export const mockCrmService = {
  getPipelines: vi.fn().mockResolvedValue([mockPipeline]),
  getPipelineStages: vi.fn().mockResolvedValue(mockPipeline.statuses),
  getUsers: vi.fn().mockResolvedValue([mockCRMUser]),
  getCompanies: vi.fn().mockResolvedValue({ _embedded: { companies: mockCompanies } }),
  createLead: vi.fn().mockResolvedValue(mockLead),
  updateLead: vi.fn().mockResolvedValue(mockLead),
  createContact: vi.fn().mockResolvedValue(mockContact),
  updateContact: vi.fn().mockResolvedValue(mockContact),
  createCompany: vi.fn().mockResolvedValue(mockCompanies[0]),
  updateCompany: vi.fn().mockResolvedValue(mockCompanies[0]),
  createTask: vi.fn().mockResolvedValue(mockTask),
  updateTask: vi.fn().mockResolvedValue(mockTask),
};

export const mockAdminService = {
  isAuthenticated: vi.fn().mockReturnValue(true),
  login: vi.fn().mockResolvedValue({ success: true, token: 'mock-token', user: mockCRMUser }),
  logout: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue(mockCRMUser),
};

