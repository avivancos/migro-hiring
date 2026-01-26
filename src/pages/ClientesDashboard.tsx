// Clientes Dashboard - Portal de facturación para clientes autenticados
//
// Muestra contratos, suscripciones, facturas y acceso al Stripe Billing Portal

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/providers/AuthProvider';
import { contractsService } from '@/services/contractsService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ClientesBillingSection } from '@/components/stripe/ClientesBillingSection';
import {
  DocumentTextIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import type { Contract } from '@/types/contracts';
import { CONTRACT_STATUS_COLORS } from '@/types/contracts';

export function ClientesDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('📋 [ClientesDashboard] Cargando contratos para cliente:', user.email);
      
      // Usar endpoint específico de cliente (JWT auth)
      try {
        const clientContracts = await contractsService.getClientContracts();
        setContracts(clientContracts);
      } catch (err: unknown) {
        console.warn('⚠️ [ClientesDashboard] No se pudieron cargar contratos:', err);
        // Si falla, intentar con búsqueda por email como fallback
        try {
          const response = await contractsService.getContracts({
            skip: 0,
            limit: 100,
            search: user.email || '',
          });
          
          // Filtrar solo contratos del cliente actual (por email)
          const userContracts = response.items.filter(
            (c) => c.client_email?.toLowerCase() === user.email?.toLowerCase()
          );
          
          setContracts(userContracts);
        } catch (fallbackErr: unknown) {
          console.error('❌ [ClientesDashboard] Error en fallback:', fallbackErr);
          setContracts([]);
          setError('No se pudieron cargar tus contratos. Por favor, contacta con soporte.');
        }
      }
    } catch (err: unknown) {
      console.error('❌ [ClientesDashboard] Error:', err);
      setError('Error al cargar tus contratos. Por favor, intenta más tarde.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading) {
      loadContracts();
    }
  }, [isLoading, loadContracts]);

  const getStatusBadge = (status: Contract['status']) => {
    const colors = CONTRACT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const labels: Record<Contract['status'], string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      completed: 'Completado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return <Badge className={colors}>{labels[status]}</Badge>;
  };

  const handleDownloadContract = async (code: string, isFinal: boolean = false) => {
    try {
      await contractsService.downloadContractFile(
        code,
        `contrato-${code}${isFinal ? '-final' : ''}.pdf`,
        isFinal
      );
    } catch (err: unknown) {
      console.error('Error descargando contrato:', err);
      alert('No se pudo descargar el contrato. Por favor, contacta con soporte.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <EmptyState
        icon={<CreditCardIcon width={48} height={48} className="text-gray-400" />}
        title="Inicia sesión"
        description="Necesitas iniciar sesión para ver tu portal de facturación."
        action={
          <Button onClick={() => navigate('/clientes')}>Ir al portal</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Portal de Facturación</h1>
          <p className="text-sm text-gray-600 mt-1">
            Sesión iniciada como <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <Button onClick={() => navigate('/clientes')} variant="outline" size="sm">
          Volver al portal
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-sm text-yellow-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Contracts list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Cargando contratos..." />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon width={48} height={48} className="text-gray-400" />}
          title="No tienes contratos"
          description="Aún no tienes contratos asociados a tu cuenta."
        />
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => {
            const hasStripe = contract.payment_type === 'subscription' || !!contract.subscription_id;
            
            return (
              <Card key={contract.hiring_code} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DocumentTextIcon width={20} height={20} />
                        Contrato {contract.hiring_code}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getStatusBadge(contract.status)}
                        {contract.service_name && (
                          <Badge variant="outline">{contract.service_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => navigate(`/clientes/${contract.hiring_code}`)}
                        variant="outline"
                        size="sm"
                      >
                        Ver detalles
                      </Button>
                      <Button
                        onClick={() => handleDownloadContract(contract.hiring_code, false)}
                        variant="outline"
                        size="sm"
                      >
                        <ArrowDownTrayIcon width={16} height={16} className="mr-2" />
                        Descargar
                      </Button>
                      {contract.status === 'completed' && (
                        <Button
                          onClick={() => handleDownloadContract(contract.hiring_code, true)}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowDownTrayIcon width={16} height={16} className="mr-2" />
                          Final
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Monto</label>
                      <div className="text-gray-900 font-semibold mt-1">
                        {formatCurrency(contract.amount, contract.currency)}
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-500">Fecha de creación</label>
                      <div className="text-gray-900 mt-1">{formatDate(contract.created_at)}</div>
                    </div>
                    {contract.contract_accepted_at && (
                      <div>
                        <label className="text-gray-500">Fecha de aceptación</label>
                        <div className="text-gray-900 mt-1">{formatDate(contract.contract_accepted_at)}</div>
                      </div>
                    )}
                    {contract.expires_at && (
                      <div>
                        <label className="text-gray-500">Expira</label>
                        <div className="text-gray-900 mt-1">{formatDate(contract.expires_at)}</div>
                      </div>
                    )}
                  </div>

                  {/* Stripe Billing Section */}
                  {hasStripe && contract.hiring_code && (
                    <div className="mt-4 pt-4 border-t">
                      <ClientesBillingSection hiringCode={contract.hiring_code} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
