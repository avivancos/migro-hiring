import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { StripeTransaction } from '@/types/stripe';
import { formatStripeAmount, formatStripeDate } from '@/utils/stripeFormatters';

interface StripeTransactionsTableProps {
  transactions?: StripeTransaction[];
}

export function StripeTransactionsTable({ transactions }: StripeTransactionsTableProps) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-sm text-gray-600">No hay transacciones registradas.</div>;
  }

  return (
    <div className="space-y-3">
      {/* Mobile: cards */}
      <div className="space-y-2 sm:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="font-medium text-gray-900 break-all">{t.id}</div>
            <div className="text-xs text-gray-600 mt-1">
              {t.status ? `Estado: ${t.status}` : 'Estado no disponible'} ·{' '}
              {formatStripeDate(t.created, { withTime: true })}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Importe: {formatStripeAmount(t.amount, t.currency)}
              {t.payment_method ? ` · Método: ${t.payment_method}` : ''}
            </div>
            {t.description && <div className="text-xs text-gray-600 mt-1">{t.description}</div>}
            <div className="flex flex-wrap gap-3 mt-2">
              {t.charge_id && (
                <a
                  href={`https://dashboard.stripe.com/payments/${t.charge_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                >
                  Ver pago <ArrowTopRightOnSquareIcon width={12} height={12} />
                </a>
              )}
              {t.invoice_id && (
                <a
                  href={`https://dashboard.stripe.com/invoices/${t.invoice_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                >
                  Ver factura <ArrowTopRightOnSquareIcon width={12} height={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Importe</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Método</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Invoice</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Charge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {formatStripeDate(t.created, { withTime: true })}
                </td>
                <td className="px-3 py-2 text-gray-700">{t.status || '—'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {formatStripeAmount(t.amount, t.currency)}
                </td>
                <td className="px-3 py-2 text-gray-700">{t.payment_method || '—'}</td>
                <td className="px-3 py-2">
                  {t.invoice_id ? (
                    <a
                      href={`https://dashboard.stripe.com/invoices/${t.invoice_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                    >
                      {t.invoice_id} <ArrowTopRightOnSquareIcon width={12} height={12} />
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {t.charge_id ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${t.charge_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                    >
                      {t.charge_id} <ArrowTopRightOnSquareIcon width={12} height={12} />
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

