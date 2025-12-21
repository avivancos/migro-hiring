// Tests de integración para expedienteApi
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expedienteApi } from '../expedienteApi';
import { api } from '../api';
import { withRetry } from '../apiRetry';

// Mock de api
vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock de apiRetry - withRetry simplemente ejecuta la función
vi.mock('../apiRetry', () => ({
  withRetry: vi.fn(async (fn) => await fn()),
}));

// Mock de errorHandler
vi.mock('@/utils/errorHandler', () => ({
  handleApiError: vi.fn((error) => ({
    message: error.message || 'Error desconocido',
    code: 'UNKNOWN_ERROR',
  })),
}));

describe('expedienteApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea un expediente correctamente', async () => {
    const mockExpediente = {
      id: '1',
      title: 'Test Expediente',
      status: 'new',
      source: 'manual',
      user_id: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(api.post).mockResolvedValue({
      data: mockExpediente,
    });

    const result = await expedienteApi.create({
      title: 'Test Expediente',
      status: 'new',
      source: 'manual',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/expedientes/',
      expect.objectContaining({
        title: 'Test Expediente',
        status: 'new',
        source: 'manual',
      })
    );
    expect(result).toEqual(mockExpediente);
  });

  it('obtiene un expediente por ID', async () => {
    const mockExpediente = {
      id: '1',
      title: 'Test Expediente',
      status: 'in_progress',
      source: 'manual',
      user_id: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      archivos: [],
    };

    vi.mocked(api.get).mockResolvedValue({
      data: mockExpediente,
    });

    const result = await expedienteApi.getById('1');

    expect(api.get).toHaveBeenCalledWith('/expedientes/1');
    expect(result).toEqual(mockExpediente);
  });

  it('actualiza un expediente', async () => {
    const mockUpdated = {
      id: '1',
      title: 'Expediente Actualizado',
      status: 'in_progress',
      source: 'manual',
      user_id: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };

    vi.mocked(api.put).mockResolvedValue({
      data: mockUpdated,
    });

    const result = await expedienteApi.update('1', {
      title: 'Expediente Actualizado',
    });

    expect(api.put).toHaveBeenCalledWith(
      '/expedientes/1',
      { title: 'Expediente Actualizado' }
    );
    expect(result).toEqual(mockUpdated);
  });

  it('elimina un expediente (soft delete)', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await expedienteApi.delete('1', false);

    expect(api.delete).toHaveBeenCalledWith('/expedientes/1', {
      params: { hard_delete: false },
    });
  });

  it('lista expedientes con filtros', async () => {
    const mockResponse = {
      items: [
        {
          id: '1',
          title: 'Expediente 1',
          status: 'new',
          source: 'manual',
          user_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
      total: 1,
      skip: 0,
      limit: 20,
    };

    vi.mocked(api.get).mockResolvedValue({
      data: mockResponse,
    });

    const result = await expedienteApi.list({
      status: 'new',
      skip: 0,
      limit: 20,
    });

    expect(api.get).toHaveBeenCalledWith('/expedientes/', {
      params: {
        status: 'new',
        skip: 0,
        limit: 20,
      },
    });
    expect(result).toEqual(mockResponse);
  });
});

