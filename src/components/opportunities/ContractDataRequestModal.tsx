// Modal para solicitar datos faltantes del contrato
// Se muestra cuando hay una solicitud de contrato pendiente con datos incompletos

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { hiringService } from '@/services/hiringService';
import type { HiringDetails } from '@/types/hiring';

interface ContractDataRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiringCode: string;
  contactName?: string;
  contactEmail?: string;
  onSuccess?: () => void;
}

interface ContractDataForm {
  client_name: string;
  client_passport?: string;
  client_nie?: string;
  client_address: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
}

export function ContractDataRequestModal({
  isOpen,
  onClose,
  hiringCode,
  contactName,
  contactEmail,
  onSuccess,
}: ContractDataRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hiringDetails, setHiringDetails] = useState<HiringDetails | null>(null);
  const [formData, setFormData] = useState<ContractDataForm>({
    client_name: '',
    client_passport: '',
    client_nie: '',
    client_address: '',
    client_city: '',
    client_province: '',
    client_postal_code: '',
  });

  // Cargar detalles del contrato al abrir el modal
  useEffect(() => {
    if (isOpen && hiringCode) {
      loadHiringDetails();
    }
  }, [isOpen, hiringCode]);

  const loadHiringDetails = async () => {
    try {
      setLoadingDetails(true);
      setError(null);
      const details = await hiringService.getDetails(hiringCode);
      setHiringDetails(details);
      
      // Pre-llenar formulario con datos existentes o del contacto
      setFormData({
        client_name: details.client_name || contactName || '',
        client_passport: details.client_passport || details.user_passport || '',
        client_nie: details.client_nie || details.user_nie || '',
        client_address: details.client_address || details.user_address || '',
        client_city: details.client_city || details.user_city || '',
        client_province: details.client_province || details.user_province || '',
        client_postal_code: details.client_postal_code || details.user_postal_code || '',
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles del contrato');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.client_name.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    if (!formData.client_passport?.trim() && !formData.client_nie?.trim()) {
      setError('Debe proporcionar al menos un número de pasaporte o NIE');
      return;
    }

    if (!formData.client_address.trim()) {
      setError('La dirección completa es obligatoria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Actualizar los datos del contrato
      // Nota: Necesitamos crear este endpoint en el backend si no existe
      await updateContractData(hiringCode, formData);
      
      setSuccess(true);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar los datos del contrato');
    } finally {
      setLoading(false);
    }
  };

  const updateContractData = async (code: string, data: ContractDataForm) => {
    // Actualizar los datos del contrato usando el endpoint de actualización de contratos
    const { contractsService } = await import('@/services/contractsService');
    await contractsService.updateContract(code, {
      client_name: data.client_name,
      client_passport: data.client_passport,
      client_nie: data.client_nie,
      client_address: data.client_address,
      client_city: data.client_city,
      client_province: data.client_province,
      client_postal_code: data.client_postal_code,
    });
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setError(null);
      setFormData({
        client_name: '',
        client_passport: '',
        client_nie: '',
        client_address: '',
        client_city: '',
        client_province: '',
        client_postal_code: '',
      });
      onClose();
    }
  };

  // Función para verificar datos faltantes (no se usa actualmente, pero se mantiene para referencia futura)
  // const hasMissingData = () => {
  //   if (!hiringDetails) return false;
  //   return (
  //     !hiringDetails.client_name ||
  //     (!hiringDetails.client_passport && !hiringDetails.client_nie) ||
  //     !hiringDetails.client_address
  //   );
  // };

  if (success) {
    return (
      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Datos Actualizados"
        size="md"
      >
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Datos del contrato actualizados correctamente
          </p>
          <p className="text-sm text-gray-600">
            La solicitud será revisada por un administrador
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Completar Datos del Contrato"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading || loadingDetails}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingDetails}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Alerta informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Datos Faltantes del Contrato
              </h3>
              <p className="text-sm text-blue-700">
                Para completar la solicitud de contrato, necesitamos los siguientes datos.
                Una vez enviados, un administrador revisará y aprobará la solicitud.
              </p>
            </div>
          </div>
        </div>

        {/* Información del contrato */}
        {hiringDetails && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Información del Contrato</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-mono font-semibold">{hiringDetails.hiring_code}</span>
              </div>
              <div>
                <span className="text-gray-600">Servicio:</span>
                <span className="ml-2 font-semibold">{hiringDetails.service_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Monto:</span>
                <span className="ml-2 font-semibold">
                  {(hiringDetails.amount / 100).toFixed(2)} {hiringDetails.currency}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2">{hiringDetails.client_email || contactEmail || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        {loadingDetails ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div>
              <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client_name"
                type="text"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                placeholder="Ej: Juan Pérez García"
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Pasaporte y NIE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_passport" className="text-sm font-medium text-gray-700">
                  Número de Pasaporte
                </Label>
                <Input
                  id="client_passport"
                  type="text"
                  value={formData.client_passport}
                  onChange={(e) =>
                    setFormData({ ...formData, client_passport: e.target.value })
                  }
                  placeholder="Ej: X1234567Z"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_nie" className="text-sm font-medium text-gray-700">
                  NIE
                </Label>
                <Input
                  id="client_nie"
                  type="text"
                  value={formData.client_nie}
                  onChange={(e) =>
                    setFormData({ ...formData, client_nie: e.target.value })
                  }
                  placeholder="Ej: X1234567Z"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              * Debe proporcionar al menos uno de los dos (Pasaporte o NIE)
            </p>

            {/* Dirección completa */}
            <div>
              <Label htmlFor="client_address" className="text-sm font-medium text-gray-700">
                Dirección Completa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client_address"
                type="text"
                value={formData.client_address}
                onChange={(e) =>
                  setFormData({ ...formData, client_address: e.target.value })
                }
                placeholder="Ej: Calle Mayor 123, 2º B"
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Ciudad, Provincia y Código Postal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="client_city" className="text-sm font-medium text-gray-700">
                  Ciudad
                </Label>
                <Input
                  id="client_city"
                  type="text"
                  value={formData.client_city}
                  onChange={(e) =>
                    setFormData({ ...formData, client_city: e.target.value })
                  }
                  placeholder="Ej: Madrid"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_province" className="text-sm font-medium text-gray-700">
                  Provincia
                </Label>
                <Input
                  id="client_province"
                  type="text"
                  value={formData.client_province}
                  onChange={(e) =>
                    setFormData({ ...formData, client_province: e.target.value })
                  }
                  placeholder="Ej: Madrid"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_postal_code" className="text-sm font-medium text-gray-700">
                  Código Postal
                </Label>
                <Input
                  id="client_postal_code"
                  type="text"
                  value={formData.client_postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, client_postal_code: e.target.value })
                  }
                  placeholder="Ej: 28001"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
