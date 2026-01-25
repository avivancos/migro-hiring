import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Contact } from '@/types/crm';
import { ContactTableRow } from '@/components/CRM/ContactTableRow';

function renderInTable(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <table>
        <tbody>{ui}</tbody>
      </table>
    </MemoryRouter>
  );
}

function formatEsDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

describe('ContactTableRow memo - visibleColumns -> fields', () => {
  it('re-renderiza si cambia ultima_llamada_fecha cuando está visible la columna ultima_llamada', () => {
    const d1 = '2026-01-01T12:00:00.000Z';
    const d2 = '2026-02-02T12:00:00.000Z';

    const base: Contact = {
      id: 'contact-ultima',
      name: 'Contacto Ultima',
      first_name: 'Contacto',
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: new Date('2026-01-01T12:00:00.000Z').toISOString(),
      updated_at: new Date('2026-01-01T12:00:00.000Z').toISOString(),
      is_deleted: false,
      ultima_llamada_fecha: d1,
    };

    const visibleColumns = ['ultima_llamada'];
    const { rerender } = renderInTable(
      <ContactTableRow contact={base} visibleColumns={visibleColumns} />
    );

    expect(screen.getByText(formatEsDate(d1))).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <table>
          <tbody>
            <ContactTableRow contact={{ ...base, ultima_llamada_fecha: d2 }} visibleColumns={visibleColumns} />
          </tbody>
        </table>
      </MemoryRouter>
    );

    expect(screen.getByText(formatEsDate(d2))).toBeInTheDocument();
    expect(screen.queryByText(formatEsDate(d1))).not.toBeInTheDocument();
  });

  it('re-renderiza si cambia proxima_llamada_fecha cuando está visible la columna proxima_llamada', () => {
    const d1 = '2026-03-03T12:00:00.000Z';
    const d2 = '2026-04-04T12:00:00.000Z';

    const base: Contact = {
      id: 'contact-proxima',
      name: 'Contacto Proxima',
      first_name: 'Contacto',
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: new Date('2026-01-01T12:00:00.000Z').toISOString(),
      updated_at: new Date('2026-01-01T12:00:00.000Z').toISOString(),
      is_deleted: false,
      proxima_llamada_fecha: d1,
    };

    const visibleColumns = ['proxima_llamada'];
    const { rerender } = renderInTable(
      <ContactTableRow contact={base} visibleColumns={visibleColumns} />
    );

    expect(screen.getByText(formatEsDate(d1))).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <table>
          <tbody>
            <ContactTableRow contact={{ ...base, proxima_llamada_fecha: d2 }} visibleColumns={visibleColumns} />
          </tbody>
        </table>
      </MemoryRouter>
    );

    expect(screen.getByText(formatEsDate(d2))).toBeInTheDocument();
    expect(screen.queryByText(formatEsDate(d1))).not.toBeInTheDocument();
  });
});

