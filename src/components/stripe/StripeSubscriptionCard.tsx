import { Badge } from '@/components/ui/badge';
import type { StripeSubscriptionInfo } from '@/types/stripe';
import { formatStripeDate } from '@/utils/stripeFormatters';

interface StripeSubscriptionCardProps {
  subscription: StripeSubscriptionInfo | null | undefined;
}

export function StripeSubscriptionCard({ subscription }: StripeSubscriptionCardProps) {
  if (!subscription) {
    return <div className="text-sm text-gray-600">Sin datos de suscripción.</div>;
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-gray-500">Suscripción</label>
        <div className="text-sm text-gray-900 mt-1 font-mono break-all">
          {subscription.id || 'No disponible'}
        </div>
        {subscription.status && (
          <div className="text-sm text-gray-600 mt-1">
            Estado: <Badge variant="outline">{subscription.status}</Badge>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        Periodo actual: {formatStripeDate(subscription.current_period_start)} -{' '}
        {formatStripeDate(subscription.current_period_end)}
      </div>

      {subscription.cancel_at_period_end !== undefined && (
        <div className="text-sm text-gray-600">
          Se cancelará al final del periodo: {subscription.cancel_at_period_end ? 'Sí' : 'No'}
        </div>
      )}
    </div>
  );
}

