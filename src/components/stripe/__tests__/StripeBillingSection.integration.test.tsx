import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StripeBillingSection } from '@/components/stripe/StripeBillingSection';

// Evitar navegación real en JSDOM
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:5173/admin/contracts/TEST01' },
  writable: true,
  configurable: true,
});

const mockGetStripeBillingSummary = vi.fn();
const mockCreateStripeBillingPortalSession = vi.fn();

vi.mock('@/services/contractsService', () => ({
  contractsService: {
    getStripeBillingSummary: (...args: unknown[]) => mockGetStripeBillingSummary(...args),
    createStripeBillingPortalSession: (...args: unknown[]) => mockCreateStripeBillingPortalSession(...args),
  },
}));

describe('StripeBillingSection (integración) - tabs, errores y portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza tabs y muestra datos de summary (suscripción, facturas, transacciones)', async () => {
    const user = userEvent.setup();

    mockGetStripeBillingSummary.mockResolvedValue({
      subscription: {
        id: 'sub_123',
        status: 'active',
        current_period_start: 1705600000,
        current_period_end: 1708200000,
        cancel_at_period_end: false,
      },
      customer: { id: 'cus_123', email: 'cliente@correo.com', name: 'Cliente' },
      default_payment_method: { id: 'pm_123', brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2026 },
      invoices: [
        {
          id: 'in_123',
          number: '0001',
          status: 'paid',
          amount_paid: 4800,
          amount_due: 0,
          currency: 'eur',
          created: 1705600000,
          hosted_invoice_url: 'https://example.com/invoice',
          invoice_pdf: 'https://example.com/invoice.pdf',
          payment_intent_id: 'pi_123',
        },
      ],
      transactions: [
        {
          id: 'pi_123',
          status: 'succeeded',
          amount: 4800,
          currency: 'eur',
          created: 1705600000,
          description: 'Pago mensual',
          payment_method: 'card',
          invoice_id: 'in_123',
          charge_id: 'ch_123',
        },
      ],
    });

    mockCreateStripeBillingPortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/session/abc' });

    render(<StripeBillingSection hiringCode="TEST01" />);

    await waitFor(() => expect(mockGetStripeBillingSummary).toHaveBeenCalledWith('TEST01'));

    expect(await screen.findByText(/suscripción & facturación/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suscripción/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transacciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /facturas/i })).toBeInTheDocument();

    // Suscripción tab (default)
    expect(screen.getByText(/sub_123/i)).toBeInTheDocument();
    expect(screen.getByText(/cus_123/i)).toBeInTheDocument();
    expect(screen.getByText(/visa \*\*\*\*4242/i)).toBeInTheDocument();

    // Facturas
    await user.click(screen.getByRole('button', { name: /facturas/i }));
    const invoiceMatches = await screen.findAllByText(/0001/i);
    expect(invoiceMatches.length).toBeGreaterThanOrEqual(1);

    // Transacciones
    await user.click(screen.getByRole('button', { name: /transacciones/i }));
    expect(await screen.findByText(/pi_123/i)).toBeInTheDocument();

    // Portal
    await user.click(screen.getByRole('button', { name: /gestionar pago/i }));
    await waitFor(() => expect(mockCreateStripeBillingPortalSession).toHaveBeenCalledWith('TEST01'));
    expect(window.location.href).toBe('https://billing.stripe.com/session/abc');
  });

  it('maneja 404 mostrando estado informativo (sin datos de Stripe)', async () => {
    mockGetStripeBillingSummary.mockRejectedValue({ response: { status: 404, data: { detail: 'Sin customer' } } });
    render(<StripeBillingSection hiringCode="TEST404" />);

    expect(await screen.findByText(/sin datos de stripe para este contrato/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('maneja 500 “Stripe no configurado” con estado informativo', async () => {
    mockGetStripeBillingSummary.mockRejectedValue({
      response: { status: 500, data: { detail: 'Stripe no está configurado' } },
    });
    render(<StripeBillingSection hiringCode="TEST500" />);

    expect(await screen.findByText(/stripe no está configurado/i)).toBeInTheDocument();
  });

  it('maneja 502 mostrando error recuperable', async () => {
    mockGetStripeBillingSummary.mockRejectedValue({ response: { status: 502, data: { detail: 'Bad gateway' } } });
    render(<StripeBillingSection hiringCode="TEST502" />);

    expect(await screen.findByText(/error consultando stripe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});

