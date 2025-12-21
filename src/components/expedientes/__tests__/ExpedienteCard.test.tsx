// Tests unitarios para ExpedienteCard
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ExpedienteCard } from '../ExpedienteCard';
import type { ExpedienteRead } from '@/types/expediente';

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockExpediente: ExpedienteRead = {
  id: '1',
  user_id: 'user-1',
  title: 'Expediente de prueba',
  status: 'in_progress',
  source: 'manual',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('ExpedienteCard', () => {
  it('renderiza el título del expediente', () => {
    render(
      <BrowserRouter>
        <ExpedienteCard expediente={mockExpediente} />
      </BrowserRouter>
    );

    expect(screen.getByText('Expediente de prueba')).toBeInTheDocument();
  });

  it('muestra el badge de estado', () => {
    render(
      <BrowserRouter>
        <ExpedienteCard expediente={mockExpediente} />
      </BrowserRouter>
    );

    // El texto se muestra como "En proceso" (minúscula) según el componente
    expect(screen.getByText(/en proceso/i)).toBeInTheDocument();
  });

  it('muestra número de expediente oficial si existe', () => {
    const expedienteConNumero = {
      ...mockExpediente,
      numero_expediente_oficial: 'EXP-12345',
    };

    render(
      <BrowserRouter>
        <ExpedienteCard expediente={expedienteConNumero} />
      </BrowserRouter>
    );

    expect(screen.getByText(/EXP-12345/)).toBeInTheDocument();
  });

  it('muestra barra de progreso si se proporciona', () => {
    render(
      <BrowserRouter>
        <ExpedienteCard expediente={mockExpediente} progress={75} />
      </BrowserRouter>
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});

