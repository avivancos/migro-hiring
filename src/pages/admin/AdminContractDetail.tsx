// Admin Contract Detail - Detalle de contrato con UI mobile-first
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contractsService } from '@/services/contractsService';
import {
  ArrowLeft,
  Download,
  Mail,
  FileText,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { Contract } from '@/types/contracts';
import {
  CONTRACT_STATUS_COLORS,
  KYC_STATUS_COLORS,
  GRADE_COLORS,
} from '@/types/contracts';
import { formatDate, formatCurrency } from '@/utils/formatters';

export function AdminContractDetail() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      loadContract();
    }
  }, [code]);

  const loadContract = async () => {
    if (!code) return;
    
    setLoading(true);
    try {
      const data = await contractsService.getContract(code);
      setContract(data);
    } catch (error) {
      console.error('Error cargando contrato:', error);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (isFinal: boolean = false) => {
    if (!contract) return;
    
    setDownloading(true);
    try {
      await contractsService.downloadContractFile(
        contract.hiring_code,
        `contrato-${contract.hiring_code}${isFinal ? '-final' : ''}.pdf`,
        isFinal
      );
    } catch (error) {
      console.error('Error descargando contrato:', error);
      alert('Error al descargar el contrato. Por favor intenta nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!contract) return;
    
    const url = `${window.location.origin}/contratacion/${contract.hiring_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    if (!contract) return;
    window.open(`/contratacion/${contract.hiring_code}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Cargando contrato..." />
      </div>
    );
  }

  if (!contract) {
    return (
      <EmptyState
        icon={FileText}
        title="Contrato no encontrado"
        description="El contrato que buscas no existe o ha sido eliminado."
        action={
          <Button onClick={() => navigate('/admin/contracts')}>
            Volver a Contratos
          </Button>
        }
      />
    );
  }

  const getStatusBadge = (status: Contract['status']) => {
    const colors = CONTRACT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const labels: Record<Contract['status'], string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      completed: 'Completado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return (
      <Badge className={colors}>
        {labels[status]}
      </Badge>
    );
  };

  const getKYCStatusBadge = (status: Contract['kyc_status']) => {
    const statusKey = status ?? null;
    const colors = (statusKey !== null ? KYC_STATUS_COLORS[statusKey] : KYC_STATUS_COLORS.null) || 'bg-gray-100 text-gray-800';
    const labels: Record<string, string> = {
      null: 'No iniciado',
      pending: 'Pendiente',
      verified: 'Verificado',
      failed: 'Fallido',
    };
    return (
      <Badge className={colors}>
        {labels[status || 'null']}
      </Badge>
    );
  };

  const getGradeBadge = (grade?: Contract['grade']) => {
    if (!grade) return null;
    const colors = GRADE_COLORS[grade] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colors}>
        Grado {grade}
      </Badge>
    );
  };

  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin/contracts')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Detalle de Contrato</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Código: <span className="font-mono">{contract.hiring_code}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar Link'}
          </Button>
          <Button
            onClick={handleOpenLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Abrir
          </Button>
          <Button
            onClick={() => handleDownload(false)}
            disabled={downloading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
          {contract.status === 'completed' && (
            <Button
              onClick={() => handleDownload(true)}
              disabled={downloading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Final
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Estado</div>
                <div className="mt-2">{getStatusBadge(contract.status)}</div>
              </div>
              {contract.status === 'completed' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : contract.status === 'expired' || contract.status === 'cancelled' ? (
                <XCircle className="text-red-500" size={24} />
              ) : (
                <Clock className="text-yellow-500" size={24} />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">KYC</div>
                <div className="mt-2">{getKYCStatusBadge(contract.kyc_status)}</div>
              </div>
              {contract.kyc_status === 'verified' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : contract.kyc_status === 'failed' ? (
                <XCircle className="text-red-500" size={24} />
              ) : (
                <Clock className="text-yellow-500" size={24} />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Monto</div>
                <div className="text-xl font-bold text-gray-900 mt-2">
                  {formatCurrency(contract.amount, contract.currency)}
                </div>
              </div>
              <DollarSign className="text-gray-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <div className="text-sm text-gray-900 mt-1">{contract.client_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    {contract.client_email}
                    <a
                      href={`mailto:${contract.client_email}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Mail size={16} />
                    </a>
                  </div>
                </div>
                {contract.client_passport && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pasaporte</label>
                    <div className="text-sm text-gray-900 mt-1">{contract.client_passport}</div>
                  </div>
                )}
                {contract.client_nie && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">NIE</label>
                    <div className="text-sm text-gray-900 mt-1">{contract.client_nie}</div>
                  </div>
                )}
                {contract.client_address && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {contract.client_address}
                      {contract.client_city && `, ${contract.client_city}`}
                      {contract.client_province && `, ${contract.client_province}`}
                      {contract.client_postal_code && ` ${contract.client_postal_code}`}
                    </div>
                  </div>
                )}
                {contract.client_nationality && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nacionalidad</label>
                    <div className="text-sm text-gray-900 mt-1">{contract.client_nationality}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Información del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre del Servicio</label>
                <div className="text-sm text-gray-900 mt-1">{contract.service_name}</div>
              </div>
              {contract.service_description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <div className="text-sm text-gray-900 mt-1">{contract.service_description}</div>
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {getGradeBadge(contract.grade)}
                {contract.payment_type && (
                  <Badge variant="outline">
                    {contract.payment_type === 'subscription' ? 'Suscripción' : 'Pago único'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {(contract.payment_intent_id || contract.manual_payment_confirmed) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign size={20} />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.payment_intent_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Intent ID</label>
                    <div className="text-sm text-gray-900 mt-1 font-mono">{contract.payment_intent_id}</div>
                  </div>
                )}
                {contract.subscription_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subscription ID</label>
                    <div className="text-sm text-gray-900 mt-1 font-mono">{contract.subscription_id}</div>
                  </div>
                )}
                {contract.manual_payment_confirmed && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pago Manual</label>
                    <div className="text-sm text-gray-900 mt-1">
                      Confirmado
                      {contract.manual_payment_method && ` - ${contract.manual_payment_method}`}
                    </div>
                    {contract.manual_payment_note && (
                      <div className="text-sm text-gray-600 mt-1">{contract.manual_payment_note}</div>
                    )}
                  </div>
                )}
                {contract.first_payment_amount && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Primer Pago</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {formatCurrency(contract.first_payment_amount, contract.currency)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-4 sm:space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(contract.created_at)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Actualizado</label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(contract.updated_at)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expira</label>
                <div className={`text-sm mt-1 ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {formatDate(contract.expires_at)}
                  {isExpired && ' (Expirado)'}
                </div>
              </div>
              {contract.contract_accepted_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Contrato Aceptado</label>
                  <div className="text-sm text-gray-900 mt-1">{formatDate(contract.contract_accepted_at)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => navigate(`/admin/contracts/${code}/edit`)}
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Edit size={16} className="mr-2" />
                Editar Contrato
              </Button>
              <Button
                onClick={handleOpenLink}
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink size={16} className="mr-2" />
                Ver en Frontend
              </Button>
              <Button
                onClick={() => handleDownload(false)}
                disabled={downloading}
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          {contract.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{contract.notes}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}



