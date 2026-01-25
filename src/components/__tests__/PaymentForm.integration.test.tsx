import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '@/components/PaymentForm';

// Evitar navegación real en JSDOM
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173/contratacion/TEST01?step=4',
    reload: vi.fn(),
  },
  writable: true,
  configurable: true,
});

const mockCreateCheckoutSession = vi.fn();
const mockConfirmPayment = vi.fn();
const mockGetAnnexes = vi.fn();
const mockUploadFinalContract = vi.fn();

vi.mock('@/services/hiringService', () => ({
  hiringService: {
    createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
    confirmPayment: (...args: unknown[]) => mockConfirmPayment(...args),
    getAnnexes: (...args: unknown[]) => mockGetAnnexes(...args),
    uploadFinalContract: (...args: unknown[]) => mockUploadFinalContract(...args),
  },
}));

describe('PaymentForm (integración) - checkout Stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea checkout session y redirige a Stripe al pulsar “Proceder al Pago”', async () => {
    const user = userEvent.setup();
    mockCreateCheckoutSession.mockResolvedValue({
      checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      session_id: 'cs_test_123',
      amount: 4800,
      total_amount: 48000,
      payment_type: 'subscription',
      installments: 10,
      currency: 'EUR',
    });

    render(
      <PaymentForm
        hiringCode="TEST01"
        amount={48000}
        currency="EUR"
        serviceName="Servicio de prueba"
        hiringDetails={{
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
          grade: 'A',
        }}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => expect(mockCreateCheckoutSession).toHaveBeenCalledWith('TEST01'));

    const payBtn = await screen.findByRole('button', { name: /proceder al pago/i });
    await waitFor(() => expect(payBtn).toBeEnabled());

    await user.click(payBtn);
    expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
  });

  it('muestra error amigable cuando falla el backend al crear checkout', async () => {
    mockCreateCheckoutSession.mockRejectedValue({
      response: { data: { detail: 'Código expirado' }, status: 410 },
      message: 'Request failed',
    });

    render(
      <PaymentForm
        hiringCode="TEST02"
        amount={48000}
        currency="EUR"
        serviceName="Servicio de prueba"
        hiringDetails={{
          id: 2,
          hiring_code: 'TEST02',
          client_name: 'Juan Pérez',
          client_email: 'juan@example.com',
          service_name: 'Servicio de prueba',
          service_description: 'Descripción',
          amount: 48000,
          currency: 'EUR',
          status: 'pending',
          kyc_status: null,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          short_url: 'http://localhost:5173/c/TEST02',
          payment_type: 'subscription',
          first_payment_amount: 4800,
        }}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => expect(mockCreateCheckoutSession).toHaveBeenCalledWith('TEST02'));

    expect(await screen.findByText(/error del servidor: código expirado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});

