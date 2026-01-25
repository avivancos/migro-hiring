import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { StripeInvoice } from '@/types/stripe';
import { formatStripeAmount, formatStripeDate } from '@/utils/stripeFormatters';

interface StripeInvoicesTableProps {
  invoices?: StripeInvoice[];
}

export function StripeInvoicesTable({ invoices }: StripeInvoicesTableProps) {
  if (!invoices || invoices.length === 0) {
    return <div className="text-sm text-gray-600">No hay facturas registradas.</div>;
  }

  return (
    <div className="space-y-3">
      {/* Mobile: cards */}
      <div className="space-y-2 sm:hidden">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="font-medium text-gray-900">{invoice.number || invoice.id}</div>
            <div className="text-xs text-gray-600 mt-1">
              {invoice.status ? `Estado: ${invoice.status}` : 'Estado no disponible'} ·{' '}
              {formatStripeDate(invoice.created)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Pagado: {formatStripeAmount(invoice.amount_paid, invoice.currency)} · Debe:{' '}
              {formatStripeAmount(invoice.amount_due, invoice.currency)}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {invoice.hosted_invoice_url && (
                <a
                  href={invoice.hosted_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                >
                  Ver <ArrowTopRightOnSquareIcon width={12} height={12} />
                </a>
              )}
              {invoice.invoice_pdf && (
                <a
                  href={invoice.invoice_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                >
                  PDF <ArrowDownTrayIcon width={12} height={12} />
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
              <th className="px-3 py-2 text-left font-medium text-gray-700">Número</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Pagado</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Debe</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {formatStripeDate(invoice.created)}
                </td>
                <td className="px-3 py-2 text-gray-900">{invoice.number || invoice.id}</td>
                <td className="px-3 py-2 text-gray-700">{invoice.status || '—'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {formatStripeAmount(invoice.amount_paid, invoice.currency)}
                </td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {formatStripeAmount(invoice.amount_due, invoice.currency)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-3">
                    {invoice.hosted_invoice_url && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                      >
                        Ver <ArrowTopRightOnSquareIcon width={12} height={12} />
                      </a>
                    )}
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                      >
                        PDF <ArrowDownTrayIcon width={12} height={12} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

