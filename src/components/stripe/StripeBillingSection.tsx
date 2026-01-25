import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { contractsService } from '@/services/contractsService';
import type { StripeBillingSummary } from '@/types/stripe';
import { StripeSubscriptionCard } from '@/components/stripe/StripeSubscriptionCard';
import { StripeDefaultPaymentMethodCard } from '@/components/stripe/StripeDefaultPaymentMethodCard';
import { StripeInvoicesTable } from '@/components/stripe/StripeInvoicesTable';
import { StripeTransactionsTable } from '@/components/stripe/StripeTransactionsTable';
import { ManageBillingButton } from '@/components/stripe/ManageBillingButton';

type StripeUiErrorKind = 'not_found' | 'not_configured' | 'stripe_error' | 'unknown';

interface StripeUiError {
  kind: StripeUiErrorKind;
  message: string;
}

interface StripeBillingSectionProps {
  hiringCode: string;
}

type HttpErrorLike = {
  response?: { status?: number; data?: { detail?: unknown } };
  message?: unknown;
};

function parseStripeError(err: unknown): StripeUiError {
  const e = err as HttpErrorLike;
  const status = typeof e?.response?.status === 'number' ? e.response.status : undefined;
  const detail = e?.response?.data?.detail ?? e?.message;
  const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail);
  const detailLower = detailStr.toLowerCase();

  if (status === 404) {
    const isContractMissing =
      detailLower.includes('contrato') ||
      detailLower.includes('contract') ||
      detailLower.includes('no encontrado') ||
      detailLower.includes('not found');
    return {
      kind: 'not_found',
      message: isContractMissing ? 'Contrato no encontrado.' : 'Sin datos de Stripe para este contrato.',
    };
  }

  if (
    status === 500 &&
    (detailLower.includes('stripe no está configurado') ||
      detailLower.includes('stripe no esta configurado') ||
      detailLower.includes('stripe not configured') ||
      (detailLower.includes('stripe') && detailLower.includes('config')))
  ) {
    return { kind: 'not_configured', message: 'Stripe no está configurado en el backend.' };
  }

  if (status === 502) {
    return { kind: 'stripe_error', message: 'Error consultando Stripe. Intenta nuevamente.' };
  }

  return { kind: 'unknown', message: detailStr || 'No se pudo cargar la información de Stripe.' };
}

export function StripeBillingSection({ hiringCode }: StripeBillingSectionProps) {
  const [summary, setSummary] = useState<StripeBillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StripeUiError | null>(null);
  const [tab, setTab] = useState<'subscription' | 'transactions' | 'invoices'>('subscription');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractsService.getStripeBillingSummary(hiringCode);
      setSummary(data);
    } catch (err: unknown) {
      setSummary(null);
      setError(parseStripeError(err));
    } finally {
      setLoading(false);
    }
  }, [hiringCode]);

  useEffect(() => {
    if (hiringCode) load();
  }, [hiringCode, load]);

  const subscription = useMemo(() => summary?.subscription ?? null, [summary]);
  const customer = useMemo(() => summary?.customer ?? null, [summary]);
  const paymentMethod = useMemo(() => summary?.default_payment_method ?? null, [summary]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon width={20} height={20} />
          Suscripción & facturación (Stripe)
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <ManageBillingButton
            hiringCode={hiringCode}
            className="bg-green-600 hover:bg-green-700 text-white"
          />
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <ArrowPathIcon width={16} height={16} className="mr-2" />
            Recargar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && <LoadingSpinner size="sm" text="Cargando información de Stripe..." />}

        {!loading && error && (
          <div
            className={
              error.kind === 'stripe_error' || error.kind === 'unknown'
                ? 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'
                : 'rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700'
            }
          >
            {error.message}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={load}>
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && !summary && (
          <div className="text-sm text-gray-600">Aún no hay información de Stripe disponible.</div>
        )}

        {!loading && !error && summary && (
          <>
            <Tabs
              value={tab}
              onValueChange={(v) => {
                if (v === 'subscription' || v === 'transactions' || v === 'invoices') {
                  setTab(v);
                }
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subscription">Suscripción</TabsTrigger>
                <TabsTrigger value="transactions">Transacciones</TabsTrigger>
                <TabsTrigger value="invoices">Facturas</TabsTrigger>
              </TabsList>

              <TabsContent value="subscription">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <StripeSubscriptionCard subscription={subscription} />
                    {(subscription?.id || null) && (
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${subscription?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 inline-flex items-center gap-1 mt-1"
                      >
                        Ver suscripción en Stripe
                      </a>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cliente Stripe</label>
                      <div className="text-sm text-gray-900 mt-1 font-mono break-all">
                        {customer?.id || 'No disponible'}
                      </div>
                      {customer?.email && <div className="text-sm text-gray-600 mt-1">{customer.email}</div>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Método de pago</label>
                      <div className="mt-1">
                        <StripeDefaultPaymentMethodCard paymentMethod={paymentMethod} />
                      </div>
                    </div>
                    {customer?.id && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${customer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 inline-flex items-center gap-1 mt-1"
                      >
                        Ver cliente en Stripe
                      </a>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <StripeTransactionsTable transactions={summary.transactions} />
              </TabsContent>

              <TabsContent value="invoices">
                <StripeInvoicesTable invoices={summary.invoices} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

