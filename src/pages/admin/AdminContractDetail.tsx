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
  History,
  File,
  CreditCard,
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
    if (code && code !== 'create') {
      loadContract();
    } else if (code === 'create') {
      // Redirigir a la lista de contratos ya que no hay página de creación todavía
      navigate('/admin/contracts');
    } else {
      setLoading(false);
    }
  }, [code, navigate]);

  const loadContract = async () => {
    if (!code) return;
    
    setLoading(true);
    try {
      const data = await contractsService.getContract(code);
      console.log('📋 Contrato cargado:', data);
      console.log('📋 service_name:', data.service_name);
      console.log('📋 service_description:', data.service_description);
      setContract(data);
    } catch (error) {
      console.error('Error cargando contrato:', error);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalContract = async (isFinal: boolean = false) => {
    if (!contract) return;
    
    console.log('🔧 Generando contrato localmente...');
    
    // Importar dinámicamente para evitar problemas de bundle
    const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
    
    // Convertir Contract a HiringDetails para el generador de PDF
    const hiringDetails = {
      id: parseInt(contract.id) || 0,
      hiring_code: contract.hiring_code,
      client_name: contract.client_name,
      client_email: contract.client_email,
      service_name: contract.service_name,
      service_description: contract.service_description || '',
      amount: contract.amount,
      currency: contract.currency,
      status: (contract.status === 'pending' || contract.status === 'paid' || contract.status === 'completed')
        ? contract.status as 'pending' | 'paid' | 'completed'
        : 'pending' as const,
      kyc_status: contract.kyc_status,
      expires_at: contract.expires_at,
      short_url: contract.short_url,
      client_passport: contract.client_passport,
      client_nie: contract.client_nie,
      client_nationality: contract.client_nationality,
      client_address: contract.client_address,
      client_city: contract.client_city,
      client_province: contract.client_province,
      client_postal_code: contract.client_postal_code,
      contract_date: contract.contract_date,
      contract_accepted: contract.contract_accepted,
      contract_accepted_at: contract.contract_accepted_at,
      grade: contract.grade,
      payment_type: contract.payment_type,
      manual_payment_confirmed: contract.manual_payment_confirmed,
      manual_payment_note: contract.manual_payment_note,
      manual_payment_method: contract.manual_payment_method,
      payment_intent_id: contract.payment_intent_id,
      subscription_id: contract.subscription_id,
      subscription_status: contract.subscription_status,
      first_payment_amount: contract.first_payment_amount,
    };
    
    // Generar PDF localmente
    const contractBlob = generateContractPDF(hiringDetails, {
      paymentIntentId: contract.payment_intent_id || 'admin_generated',
      stripeTransactionId: contract.payment_intent_id || `admin_${Date.now()}`,
      paymentDate: contract.contract_accepted_at || new Date().toISOString(),
      paymentMethod: contract.manual_payment_method || 'Generado desde admin',
      paymentNote: contract.manual_payment_note,
      clientSignature: undefined, // No tenemos firma del cliente en el admin
    }, !isFinal); // isDraft = true si no es final, false si es final
    
    // Descargar el PDF generado
    const url = window.URL.createObjectURL(contractBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrato-${contract.hiring_code}${isFinal ? '-final' : ''}.pdf`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    console.log('✅ Contrato generado y descargado localmente');
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
      console.log('✅ Contrato descargado desde el backend');
    } catch (error: any) {
      console.warn('⚠️ No se pudo descargar desde el backend, generando localmente:', error);
      
      // Verificar si es un error 404 u otro error
      const is404 = error?.response?.status === 404 || 
                    error?.message?.includes('404') ||
                    error?.message?.includes('no encontrado') ||
                    error?.message?.includes('Recurso no encontrado');
      
      if (is404) {
        console.log('🔧 Contrato no disponible en backend (404), generando localmente...');
        try {
          await generateLocalContract(isFinal);
        } catch (localErr) {
          console.error('❌ Error generando contrato local:', localErr);
          alert('No se pudo generar el contrato. Por favor, contacta con soporte.');
        }
      } else {
        // Para otros errores, también intentar generar localmente
        try {
          await generateLocalContract(isFinal);
        } catch (localErr) {
          console.error('❌ Error generando contrato local:', localErr);
          alert('Error al descargar el contrato desde el servidor. Se intentó generar localmente pero falló. Por favor, contacta con soporte.');
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!contract) return;
    
    // Formato: migro.es/c/(codigo)
    const url = `https://migro.es/c/${contract.hiring_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    if (!contract) return;
    // Usar la ruta interna pero mostrar el formato corto
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
        icon={<FileText size={48} className="text-gray-400" />}
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
              Enlace: <span className="font-mono">migro.es/c/{contract.hiring_code}</span>
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
                <div className="text-base font-semibold text-gray-900 mt-1">
                  {contract.service_name || 'No especificado'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción del Servicio</label>
                <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
                  {contract.service_description || 'No hay descripción disponible'}
                </div>
              </div>
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
                    <div className="text-sm text-gray-900 mt-1 font-mono break-all">{contract.payment_intent_id}</div>
                    <a
                      href={`https://dashboard.stripe.com/payments/${contract.payment_intent_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 mt-1 inline-flex items-center gap-1"
                    >
                      Ver en Stripe <ExternalLink size={14} />
                    </a>
                  </div>
                )}
                {contract.subscription_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subscription ID</label>
                    <div className="text-sm text-gray-900 mt-1 font-mono break-all">{contract.subscription_id}</div>
                    {contract.subscription_status && (
                      <div className="text-sm text-gray-600 mt-1">
                        Estado: <Badge variant="outline">{contract.subscription_status}</Badge>
                      </div>
                    )}
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${contract.subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 mt-1 inline-flex items-center gap-1"
                    >
                      Ver en Stripe <ExternalLink size={14} />
                    </a>
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

          {/* Contract History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History size={20} />
                Historial del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline */}
                <div className="relative">
                  {/* Created / Draft */}
                  <div className="flex gap-4 pb-6">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="text-blue-600" size={20} />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Borrador Creado</p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(contract.created_at)}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Borrador
                        </Badge>
                      </div>
                      {contract.contract_pdf_url && (
                        <div className="mt-2">
                          <a
                            href={contract.contract_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                          >
                            <File size={14} />
                            Ver PDF del borrador
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signed / Contract Accepted */}
                  {contract.contract_accepted_at && (
                    <div className="flex gap-4 pb-6">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="text-green-600" size={20} />
                        </div>
                        {(contract.payment_intent_id || contract.subscription_id || contract.manual_payment_confirmed) && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">Contrato Firmado</p>
                            <p className="text-sm text-gray-500 mt-1">{formatDate(contract.contract_accepted_at)}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Firmado
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {(contract.payment_intent_id || contract.subscription_id || contract.manual_payment_confirmed) && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <CreditCard className="text-purple-600" size={20} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {contract.manual_payment_confirmed ? 'Pago Manual Confirmado' : 'Pago Procesado'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {contract.updated_at ? formatDate(contract.updated_at) : 'Fecha no disponible'}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Pagado
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {contract.payment_intent_id && (
                            <div className="text-sm bg-gray-50 p-2 rounded border">
                              <p className="font-medium text-gray-700">Stripe Payment Intent:</p>
                              <p className="text-gray-600 font-mono text-xs break-all mt-1">
                                {contract.payment_intent_id}
                              </p>
                              <a
                                href={`https://dashboard.stripe.com/payments/${contract.payment_intent_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-700 mt-1 inline-flex items-center gap-1"
                              >
                                Ver en Stripe <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                          {contract.subscription_id && (
                            <div className="text-sm bg-gray-50 p-2 rounded border">
                              <p className="font-medium text-gray-700">Stripe Subscription:</p>
                              <p className="text-gray-600 font-mono text-xs break-all mt-1">
                                {contract.subscription_id}
                              </p>
                              {contract.subscription_status && (
                                <p className="text-gray-600 text-xs mt-1">
                                  Estado: <span className="font-semibold">{contract.subscription_status}</span>
                                </p>
                              )}
                              <a
                                href={`https://dashboard.stripe.com/subscriptions/${contract.subscription_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-700 mt-1 inline-flex items-center gap-1"
                              >
                                Ver en Stripe <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                          {contract.manual_payment_confirmed && (
                            <div className="text-sm bg-gray-50 p-2 rounded border">
                              <p className="font-medium text-gray-700">Pago Manual:</p>
                              <p className="text-gray-600 mt-1">
                                {contract.manual_payment_method || 'Método no especificado'}
                              </p>
                              {contract.manual_payment_note && (
                                <p className="text-gray-600 text-xs mt-1 italic">{contract.manual_payment_note}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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



