import type { StripePaymentMethodInfo } from '@/types/stripe';

interface StripeDefaultPaymentMethodCardProps {
  paymentMethod: StripePaymentMethodInfo | null | undefined;
}

export function StripeDefaultPaymentMethodCard({ paymentMethod }: StripeDefaultPaymentMethodCardProps) {
  if (!paymentMethod) {
    return <div className="text-sm text-gray-600">Método de pago no disponible.</div>;
  }

  return (
    <div className="text-sm text-gray-700">
      <div>
        {paymentMethod.brand || 'Tarjeta'} ****{paymentMethod.last4 || '----'}
        {paymentMethod.exp_month && paymentMethod.exp_year && (
          <span className="text-gray-600">
            {' '}
            (exp {paymentMethod.exp_month}/{paymentMethod.exp_year})
          </span>
        )}
      </div>
    </div>
  );
}

