import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('ContactTableRow memo - callbacks', () => {
  it('usa el callback actualizado de onNavigate cuando cambia en el padre', async () => {
    const user = userEvent.setup();
    const onNavigateV1 = vi.fn();
    const onNavigateV2 = vi.fn();

    const contact: Contact = {
      id: 'contact-1',
      name: 'Juan Pérez',
      first_name: 'Juan',
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString(),
      is_deleted: false,
    };
    const visibleColumns = ['name'];

    const { rerender } = renderInTable(
      <ContactTableRow contact={contact} visibleColumns={visibleColumns} onNavigate={onNavigateV1} />
    );

    await user.click(screen.getByText('Juan Pérez'));
    expect(onNavigateV1).toHaveBeenCalledWith('contact-1');
    expect(onNavigateV2).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <table>
          <tbody>
            <ContactTableRow contact={contact} visibleColumns={visibleColumns} onNavigate={onNavigateV2} />
          </tbody>
        </table>
      </MemoryRouter>
    );

    await user.click(screen.getByText('Juan Pérez'));
    expect(onNavigateV2).toHaveBeenCalledWith('contact-1');
  });

  it('usa el callback actualizado de onToggleSelected cuando cambia en el padre', async () => {
    const user = userEvent.setup();
    const onToggleV1 = vi.fn();
    const onToggleV2 = vi.fn();

    const contact: Contact = {
      id: 'contact-2',
      name: 'María López',
      first_name: 'María',
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString(),
      is_deleted: false,
    };
    const visibleColumns = ['name'];

    const { rerender } = renderInTable(
      <ContactTableRow
        contact={contact}
        visibleColumns={visibleColumns}
        showSelection
        isSelected={false}
        selectionDisabled={false}
        onToggleSelected={onToggleV1}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: /seleccionar contacto/i }));
    expect(onToggleV1).toHaveBeenCalledWith(true);
    expect(onToggleV2).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <table>
          <tbody>
            <ContactTableRow
              contact={contact}
              visibleColumns={visibleColumns}
              showSelection
              isSelected={false}
              selectionDisabled={false}
              onToggleSelected={onToggleV2}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('checkbox', { name: /seleccionar contacto/i }));
    expect(onToggleV2).toHaveBeenCalledWith(true);
  });
});

