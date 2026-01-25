import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmData } from '@/components/ConfirmData';

// Evitar navegación real en JSDOM al asignar window.location.href
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:5173/contratacion/TEST01' },
  writable: true,
  configurable: true,
});

// Mock de ContractViewer (evita dependencias de PDF/iframes)
vi.mock('@/components/ContractViewer', () => ({
  ContractViewer: ({ contractBlob }: { contractBlob: Blob | null }) => (
    <div data-testid="contract-viewer">{contractBlob ? 'pdf-ready' : 'pdf-loading'}</div>
  ),
}));

const mockGetAnnexes = vi.fn();
const mockAcceptContract = vi.fn();

vi.mock('@/services/hiringService', () => ({
  hiringService: {
    getAnnexes: (...args: unknown[]) => mockGetAnnexes(...args),
    acceptContract: (...args: unknown[]) => mockAcceptContract(...args),
  },
}));

const mockGenerateContractPDF = vi.fn();
vi.mock('@/utils/contractPdfGenerator', () => ({
  generateContractPDF: (...args: unknown[]) => mockGenerateContractPDF(...args),
}));

function makeDetails(overrides?: Partial<import('@/types/hiring').HiringDetails>) {
  const base: import('@/types/hiring').HiringDetails = {
    id: 1,
    hiring_code: 'TEST01',
    client_name: 'Juan Pérez',
    client_email: 'juan@example.com',
    service_name: 'Servicio de prueba',
    service_description: 'Descripción',
    amount: 48000,
    currency: 'EUR',
    status: 'pending',
    kyc_status: null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    short_url: 'http://localhost:5173/c/TEST01',
    payment_type: 'subscription',
    first_payment_amount: 4800,
    annexes: [],
  };
  return { ...base, ...(overrides || {}) };
}

describe('ConfirmData (integración) - envío/recepción backend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnnexes.mockResolvedValue([]);
    mockAcceptContract.mockResolvedValue(undefined);
    mockGenerateContractPDF.mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  it('bloquea avanzar si no se aceptan los checkboxes (validación UX)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();

    render(<ConfirmData details={makeDetails()} onConfirm={onConfirm} onBack={onBack} />);

    // Esperar a que el PDF se genere y habilite el botón
    const submit = await screen.findByRole('button', { name: /confirmar y continuar/i });
    await waitFor(() => expect(submit).toBeDisabled());

    // Intentar click en botón deshabilitado no debe disparar onConfirm
    await user.click(submit);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('envía contrato al backend (acceptContract) y luego ejecuta onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();

    render(<ConfirmData details={makeDetails()} onConfirm={onConfirm} onBack={onBack} />);

    // Esperar a que se genere el PDF (contractBlob != null) y habilite el botón
    await waitFor(() => {
      expect(mockGenerateContractPDF).toHaveBeenCalled();
    });

    const submit = screen.getByRole('button', { name: /confirmar y continuar/i });
    await waitFor(() => expect(submit).toBeEnabled());

    // Checkboxes
    await user.click(screen.getByLabelText(/confirmo que mis datos personales son correctos/i));
    await user.click(screen.getByLabelText(/he leído y acepto los términos y condiciones/i));

    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockAcceptContract).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('si acceptContract da 404, no bloquea el flujo (onConfirm se ejecuta)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();

    mockAcceptContract.mockRejectedValue({ response: { status: 404 } });

    render(<ConfirmData details={makeDetails()} onConfirm={onConfirm} onBack={onBack} />);

    const submit = screen.getByRole('button', { name: /confirmar y continuar/i });
    await waitFor(() => expect(submit).toBeEnabled());

    await user.click(screen.getByLabelText(/confirmo que mis datos personales son correctos/i));
    await user.click(screen.getByLabelText(/he leído y acepto los términos y condiciones/i));

    await user.click(submit);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});

