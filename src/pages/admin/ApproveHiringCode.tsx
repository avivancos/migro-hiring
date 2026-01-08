// Approve Hiring Code Page - Aprobación de código de contratación con token hash
// Ruta pública: /admin/approve-hiring-code?token={token_hash}
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { pipelineApi } from '@/services/pipelineApi';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon, DocumentTextIcon, EnvelopeIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { usePageTitle } from '@/hooks/usePageTitle';

interface HiringPayment {
  id: number;
  hiring_code: string;
  amount: number;
  currency: string;
  payment_type: string;
}

interface TokenValidationData {
  valid: boolean;
  token_id: string;
  pipeline_stage_id: string;
  hiring_payment: HiringPayment;
  expires_at: string;
  admin_email: string;
}

interface ApprovalResponse {
  success: boolean;
  message: string;
  pipeline_stage_id: string;
  hiring_payment: {
    id: number;
    hiring_code: string;
    amount: number;
    currency: string;
  };
  approved_at: string;
}

export function ApproveHiringCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [data, setData] = useState<TokenValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [approvalResult, setApprovalResult] = useState<ApprovalResponse | null>(null);

  // Actualizar título de página
  usePageTitle();

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado en la URL');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const validationData = await pipelineApi.validateHiringCodeApprovalToken(token);
      setData(validationData);
    } catch (err: any) {
      console.error('Error validando token:', err);
      
      // Manejar diferentes tipos de errores
      if (err.response?.status === 404) {
        setError('Token no encontrado. El enlace puede ser inválido o haber expirado.');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.detail || 'Token inválido o ya utilizado';
        setError(errorMessage);
      } else {
        setError(err.response?.data?.detail || err.message || 'Error al validar el token');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token) return;

    setValidating(true);
    setError(null);

    try {
      const result = await pipelineApi.approveHiringCodeWithToken(token);
      setApprovalResult(result);
      setApproved(true);

      // Redirigir después de 5 segundos
      setTimeout(() => {
        navigate(`/admin/opportunities`);
      }, 5000);
    } catch (err: any) {
      console.error('Error aprobando solicitud:', err);
      
      if (err.response?.status === 404) {
        setError('Token no encontrado. El enlace puede ser inválido o haber expirado.');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.detail || 'Token inválido o ya utilizado';
        setError(errorMessage);
      } else {
        setError(err.response?.data?.detail || err.message || 'Error al aprobar la solicitud');
      }
    } finally {
      setValidating(false);
    }
  };

  // Estado: Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Validando token..." />
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
                <Button
                  variant="default"
                  onClick={validateToken}
                  className="flex-1"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Aprobado exitosamente
  if (approved && approvalResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Solicitud Aprobada
              </h1>
              <p className="text-gray-700 mb-6">
                La solicitud de código de contratación ha sido aprobada exitosamente.
              </p>
              
              {approvalResult.hiring_payment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 w-full">
                  <p className="text-sm text-gray-600 mb-1">Código de Contratación</p>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {approvalResult.hiring_payment.hiring_code}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    <span>
                      {formatCurrency(
                        approvalResult.hiring_payment.amount,
                        approvalResult.hiring_payment.currency.toLowerCase()
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-6">
                <p>Aprobado el {formatDateTime(approvalResult.approved_at)}</p>
                <p className="mt-2">Redirigiendo al panel de oportunidades en 5 segundos...</p>
              </div>

              <Button
                variant="default"
                onClick={() => navigate('/admin/opportunities')}
                className="w-full"
              >
                Ir a Oportunidades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Revisión (mostrar información y botón aprobar)
  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
                <CardTitle className="text-2xl">
                  Aprobar Solicitud de Código de Contratación
                </CardTitle>
              </div>
              <p className="text-gray-600">
                Revisa los detalles de la solicitud y aprueba el código de contratación.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del Token */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Información del Token</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">
                      Email: <strong>{data.admin_email}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">
                      Expira: <strong>{formatDateTime(data.expires_at)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Hiring Payment */}
              {data.hiring_payment && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-green-600" />
                    Detalles del Contrato
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Código de Contratación:
                      </span>
                      <div className="bg-white border-2 border-green-200 rounded-lg p-3">
                        <p className="text-2xl font-bold text-green-600 text-center">
                          {data.hiring_payment.hiring_code}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Monto:</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(
                            data.hiring_payment.amount,
                            data.hiring_payment.currency.toLowerCase()
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Tipo de Pago:</span>
                        <Badge
                          variant={data.hiring_payment.payment_type === 'one_time' ? 'default' : 'secondary'}
                          className="text-sm"
                        >
                          {data.hiring_payment.payment_type === 'one_time' ? 'Pago Único' : 'Suscripción'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error si hay */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="flex-1"
                  disabled={validating}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={validating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {validating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Aprobar Solicitud
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback (no debería llegar aquí)
  return null;
}
