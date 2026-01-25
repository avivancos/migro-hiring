import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminContractDetail } from '@/pages/admin/AdminContractDetail';

// Evitar alert real
global.alert = vi.fn();

// Aislar dependencias pesadas del detalle
vi.mock('@/components/contracts/ContractAnnexes', () => ({
  ContractAnnexes: () => <div data-testid="annexes-stub" />,
}));
vi.mock('@/components/contracts/EditContractModal', () => ({
  EditContractModal: () => null,
}));
vi.mock('@/components/stripe/StripeBillingSection', () => ({
  StripeBillingSection: ({ hiringCode }: { hiringCode: string }) => (
    <div data-testid="stripe-section-stub">{hiringCode}</div>
  ),
}));

const mockGetContract = vi.fn();
const mockUpdateContract = vi.fn();

vi.mock('@/services/contractsService', () => ({
  contractsService: {
    getContract: (...args: unknown[]) => mockGetContract(...args),
    updateContract: (...args: unknown[]) => mockUpdateContract(...args),
    downloadContractFile: vi.fn(),
    getAnnexes: vi.fn(),
  },
}));

describe('AdminContractDetail (integración) - formulario Modificar Estado y Pago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía updateContract con datos del formulario y muestra confirmación', async () => {
    const user = userEvent.setup();

    mockGetContract.mockResolvedValue({
      id: '1',
      hiring_code: 'TEST01',
      client_name: 'Juan Pérez',
      client_email: 'juan@example.com',
      service_name: 'Servicio',
      service_description: 'Desc',
      amount: 48000,
      currency: 'EUR',
      status: 'pending',
      kyc_status: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      short_url: 'http://localhost:5173/c/TEST01',
      payment_type: 'subscription',
      subscription_id: 'sub_123',
      subscription_status: 'active',
    });

    mockUpdateContract.mockResolvedValue({
      id: '1',
      hiring_code: 'TEST01',
      client_name: 'Juan Pérez',
      client_email: 'juan@example.com',
      service_name: 'Servicio',
      service_description: 'Desc',
      amount: 48000,
      currency: 'EUR',
      status: 'paid',
      kyc_status: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      short_url: 'http://localhost:5173/c/TEST01',
      payment_type: 'subscription',
      subscription_id: 'sub_123',
      subscription_status: 'active',
      manual_payment_confirmed: true,
      manual_payment_method: 'Transferencia',
    });

    render(
      <MemoryRouter initialEntries={['/admin/contracts/TEST01']}>
        <Routes>
          <Route path="/admin/contracts/:code" element={<AdminContractDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGetContract).toHaveBeenCalledWith('TEST01'));

    // Abrir modal
    const openBtnText = await screen.findByText(/modificar estado y pago/i);
    const openBtn = openBtnText.closest('button');
    expect(openBtn).toBeTruthy();
    await user.click(openBtn as HTMLButtonElement);

    // Cambiar estado
    await user.selectOptions(screen.getByLabelText(/estado del contrato/i), 'paid');

    // Marcar pago manual
    const manualCheckbox = screen.getByLabelText(/pago realizado externamente/i);
    await user.click(manualCheckbox);

    await user.type(screen.getByLabelText(/método de pago/i), 'Transferencia');

    // Guardar cambios
    const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateContract).toHaveBeenCalledWith(
        'TEST01',
        expect.objectContaining({
          status: 'paid',
          manual_payment_confirmed: true,
          manual_payment_method: 'Transferencia',
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith('Estado del contrato actualizado correctamente');
  });
});

