// Tests unitarios para usePermissions
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { useAuth } from '../useAuth';
import type { ExpedienteRead } from '@/types/expediente';

// Mock de useAuth
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockExpediente: ExpedienteRead = {
  id: '1',
  user_id: 'user-1',
  title: 'Test',
  status: 'new',
  source: 'manual',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite editar expediente si es superuser', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'admin-1', is_superuser: true, role: 'admin' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditExpediente(mockExpediente)).toBe(true);
  });

  it('permite editar expediente si es lawyer', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'lawyer-1', is_superuser: false, role: 'lawyer' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditExpediente(mockExpediente)).toBe(true);
  });

  it('permite editar expediente si es el dueño', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', is_superuser: false, role: 'user' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditExpediente(mockExpediente)).toBe(true);
  });

  it('no permite editar expediente si no tiene permisos', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-2', is_superuser: false, role: 'user' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditExpediente(mockExpediente)).toBe(false);
  });

  it('permite cambiar estado si es lawyer o admin', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'lawyer-1', is_superuser: false, role: 'lawyer' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canChangeStatus(mockExpediente)).toBe(true);
  });

  it('no permite cambiar estado si es usuario normal', () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', is_superuser: false, role: 'user' },
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.canChangeStatus(mockExpediente)).toBe(false);
  });
});











