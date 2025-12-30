// Tests de integración para pipelineApi
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pipelineApi } from '../pipelineApi';
import { api } from '../api';

// Mock de api
vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock de localStorage para CRM token
const localStorageMock = {
  getItem: vi.fn(() => 'mock-crm-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

describe('pipelineApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-crm-token');
  });

  it('obtiene un stage de pipeline', async () => {
    const mockStage = {
      id: '1',
      entity_id: 'contact-1',
      entity_type: 'contacts' as const,
      current_stage: 'agent_initial' as const,
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(api.get).mockResolvedValue({
      data: mockStage,
    });

    const result = await pipelineApi.getStage('contacts', 'contact-1');

    expect(api.get).toHaveBeenCalledWith(
      '/pipelines/stages/contacts/contact-1',
      {
        headers: {
          'X-CRM-Auth': 'mock-crm-token',
        },
      }
    );
    expect(result).toEqual(mockStage);
  });

  it('crea o actualiza un stage', async () => {
    const mockStage = {
      id: '1',
      entity_id: 'contact-1',
      entity_type: 'contacts' as const,
      current_stage: 'lawyer_validation' as const,
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(api.post).mockResolvedValue({
      data: mockStage,
    });

    const result = await pipelineApi.createOrUpdateStage({
      entity_id: 'contact-1',
      entity_type: 'contacts',
      current_stage: 'lawyer_validation',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/pipelines/stages',
      {
        entity_id: 'contact-1',
        entity_type: 'contacts',
        current_stage: 'lawyer_validation',
      },
      {
        headers: {
          'X-CRM-Auth': 'mock-crm-token',
        },
      }
    );
    expect(result).toEqual(mockStage);
  });

  it('crea una acción', async () => {
    const mockAction = {
      id: '1',
      pipeline_stage_id: 'stage-1',
      action_type: 'create_situation',
      performed_by_id: 'agent-1',
      status: 'pending_validation' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(api.post).mockResolvedValue({
      data: mockAction,
    });

    const result = await pipelineApi.createAction({
      pipeline_stage_id: 'stage-1',
      action_type: 'create_situation',
      performed_by_id: 'agent-1',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/pipelines/actions',
      {
        pipeline_stage_id: 'stage-1',
        action_type: 'create_situation',
        performed_by_id: 'agent-1',
      },
      {
        headers: {
          'X-CRM-Auth': 'mock-crm-token',
        },
      }
    );
    expect(result).toEqual(mockAction);
  });

  it('valida una acción', async () => {
    const mockValidated = {
      id: '1',
      pipeline_stage_id: 'stage-1',
      action_type: 'create_situation',
      performed_by_id: 'agent-1',
      status: 'validated' as const,
      validated_at: '2025-01-02T00:00:00Z',
      validated_by_id: 'lawyer-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };

    vi.mocked(api.post).mockResolvedValue({
      data: mockValidated,
    });

    const result = await pipelineApi.validateAction('1', {
      status: 'validated',
      validation_notes: 'Aprobado',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/pipelines/actions/1/validate',
      {
        status: 'validated',
        validation_notes: 'Aprobado',
      },
      {
        headers: {
          'X-CRM-Auth': 'mock-crm-token',
        },
      }
    );
    expect(result).toEqual(mockValidated);
  });
});













