import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { contractsService } from '@/services/contractsService';
import { getErrorMessage } from '@/services/api';

interface ManageBillingButtonProps {
  hiringCode: string;
  className?: string;
}

export function ManageBillingButton({ hiringCode, className }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Usar método que intenta cliente primero, luego admin
      const session = await contractsService.createStripeBillingPortalSession(hiringCode);
      if (session?.url) {
        window.location.href = session.url;
      } else {
        alert('No se recibió URL del portal de facturación');
      }
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="default"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Abriendo...' : 'Gestionar pago'}
    </Button>
  );
}

