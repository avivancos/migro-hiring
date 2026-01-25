import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';

export function formatStripeDate(
  value?: string | number | null,
  opts?: { withTime?: boolean }
): string {
  if (value === undefined || value === null) return 'Fecha no disponible';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return opts?.withTime ? formatDateTime(date) : formatDate(date);
}

export function formatStripeAmount(
  amountInCents?: number | null,
  currency?: string | null
): string {
  if (amountInCents === undefined || amountInCents === null) return 'Monto no disponible';
  return formatCurrency(amountInCents, (currency || 'eur') ?? 'eur');
}

