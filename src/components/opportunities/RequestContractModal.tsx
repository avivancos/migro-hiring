// Modal para solicitar un código de contratación (hiring code)
// Se muestra cuando el agente quiere solicitar un contrato para avanzar con la venta

import { useState, useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DocumentTextIcon, ExclamationCircleIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { api } from '@/services/api';
import type { LeadOpportunity } from '@/types/opportunity';
import type { Contact } from '@/types/crm';

interface RequestContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'contacts' | 'leads';
  entityId: string;
  opportunity?: LeadOpportunity;
  contact?: Contact;
  onSuccess?: (hiringCode: string) => void;
}

interface RequestContractForm {
  agent_signature: string;
  contract_template: string;
  service_name: string;
  grade: 'A' | 'B' | 'C';
  payment_type: 'deferred' | 'two_payments';
  expires_in_days: number;
  currency: string;
  // Datos del cliente (obligatorios)
  client_name: string;
  client_passport: string;
  client_nie: string;
  client_address: string;
  client_province: string;
  client_postal_code: string;
  passport_file?: File; // Archivo de copia de pasaporte
}

// Función helper para mapear grading del contacto al grade del contrato
const mapContactGradingToContractGrade = (grading?: 'A' | 'B+' | 'B-' | 'C' | 'D'): 'A' | 'B' | 'C' => {
  if (!grading) return 'B';
  
  switch (grading) {
    case 'A':
      return 'A';
    case 'B+':
    case 'B-':
      return 'B';
    case 'C':
    case 'D':
      return 'C';
    default:
      return 'B';
  }
};

export function RequestContractModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  opportunity,
  contact,
  onSuccess,
}: RequestContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hiringCode, setHiringCode] = useState<string | null>(null);
  const passportFileInputRef = useRef<HTMLInputElement>(null);
  
  // Determinar el grade inicial desde el contacto
  const initialGrade = contact 
    ? mapContactGradingToContractGrade(contact.grading_situacion || contact.grading_llamada)
    : 'B';
  
  const [formData, setFormData] = useState<RequestContractForm>({
    agent_signature: '',
    contract_template: 'standard',
    service_name: opportunity?.pipeline_stage?.current_stage || '',
    grade: initialGrade,
    payment_type: 'two_payments',
    expires_in_days: 30,
    currency: 'EUR',
    // Pre-llenar datos del cliente desde el contacto si están disponibles
    client_name: contact?.name || '',
    client_passport: contact?.custom_fields?.passport || '',
    client_nie: contact?.custom_fields?.nie || '',
    client_address: contact?.address || '',
    client_province: contact?.state || '',
    client_postal_code: contact?.postal_code || '',
    passport_file: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.agent_signature.trim()) {
      setError('La firma del agente es obligatoria');
      return;
    }

    if (!formData.service_name.trim()) {
      setError('El nombre del servicio es obligatorio');
      return;
    }

    if (!formData.client_name.trim()) {
      setError('El nombre completo del cliente es obligatorio');
      return;
    }

    if (!formData.client_passport?.trim() && !formData.client_nie?.trim() && !formData.passport_file) {
      setError('Debe proporcionar al menos un número de pasaporte, NIE o copia de pasaporte');
      return;
    }

    if (!formData.client_address.trim()) {
      setError('La dirección completa es obligatoria');
      return;
    }

    if (!formData.client_province.trim()) {
      setError('La provincia es obligatoria');
      return;
    }

    if (!formData.client_postal_code.trim()) {
      setError('El código postal es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calcular el monto según el grado (en centavos)
      const gradePricing: Record<string, number> = {
        'A': 40000,  // 400 EUR
        'B': 40000,  // 400 EUR
        'C': 60000,  // 600 EUR
      };

      // Convertir payment_type al formato del backend
      // 'deferred' -> 'subscription' (aplazada)
      // 'two_payments' -> 'one_time' (en dos pagos)
      const backendPaymentType = formData.payment_type === 'deferred' ? 'subscription' : 'one_time';

      // El backend ahora solo acepta FormData (multipart/form-data)
      // Siempre usar FormData, incluso cuando no hay archivo
      const formDataToSend = new FormData();
      formDataToSend.append('agent_signature', formData.agent_signature);
      formDataToSend.append('contract_template', formData.contract_template);
      formDataToSend.append('service_name', formData.service_name);
      formDataToSend.append('grade', formData.grade);
      formDataToSend.append('amount', gradePricing[formData.grade].toString());
      formDataToSend.append('payment_type', backendPaymentType);
      formDataToSend.append('expires_in_days', formData.expires_in_days.toString());
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('client_name', formData.client_name);
      formDataToSend.append('client_email', contact?.email || '');
      if (formData.client_passport) {
        formDataToSend.append('client_passport', formData.client_passport);
      }
      if (formData.client_nie) {
        formDataToSend.append('client_nie', formData.client_nie);
      }
      formDataToSend.append('client_address', formData.client_address);
      formDataToSend.append('client_province', formData.client_province);
      formDataToSend.append('client_postal_code', formData.client_postal_code);
      
      // Agregar archivo solo si existe
      if (formData.passport_file) {
        formDataToSend.append('passport_file', formData.passport_file);
      }

      // No establecer Content-Type explícitamente - axios lo genera automáticamente con el boundary correcto
      const response = await api.post(
        `/pipelines/stages/${entityType}/${entityId}/request-hiring-code`,
        formDataToSend
      );

      const result = response.data;
      setHiringCode(result.hiring_code);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(result.hiring_code);
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al solicitar el código de contratación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setError(null);
      setHiringCode(null);
      const initialGrade = contact 
        ? mapContactGradingToContractGrade(contact.grading_situacion || contact.grading_llamada)
        : 'B';
      setFormData({
        agent_signature: '',
        contract_template: 'standard',
        service_name: opportunity?.pipeline_stage?.current_stage || '',
        grade: initialGrade,
        payment_type: 'two_payments',
        expires_in_days: 30,
        currency: 'EUR',
        client_name: contact?.name || '',
        client_passport: contact?.custom_fields?.passport || '',
        client_nie: contact?.custom_fields?.nie || '',
        client_address: contact?.address || '',
        client_province: contact?.state || '',
        client_postal_code: contact?.postal_code || '',
        passport_file: undefined,
      });
      if (passportFileInputRef.current) {
        passportFileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('El archivo debe ser una imagen (JPG, PNG) o PDF');
        return;
      }
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe exceder 10MB');
        return;
      }
      setFormData({ ...formData, passport_file: file });
      setError(null);
    }
  };

  const removePassportFile = () => {
    setFormData({ ...formData, passport_file: undefined });
    if (passportFileInputRef.current) {
      passportFileInputRef.current.value = '';
    }
  };

  if (success && hiringCode) {
    return (
      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Código de Contratación Generado"
        size="md"
      >
        <div className="text-center py-6">
          <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Código generado exitosamente
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Código de Contratación</p>
            <p className="text-3xl font-bold text-green-600 font-mono">
              {hiringCode}
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Se ha enviado un email al administrador para su aprobación.
          </p>
          <Button
            onClick={handleClose}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Solicitar Código de Contratación"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Solicitar Código
              </>
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Solicitud de Contrato
              </h3>
              <p className="text-sm text-blue-700">
                Al solicitar un código de contratación, confirmas que la situación migrante está completada.
                Un administrador revisará y aprobará la solicitud.
              </p>
            </div>
          </div>
        </div>

        {/* Firma del agente */}
        <div>
          <Label htmlFor="agent_signature" className="text-sm font-medium text-gray-700">
            Firma del Agente <span className="text-red-500">*</span>
          </Label>
          <Input
            id="agent_signature"
            type="text"
            value={formData.agent_signature}
            onChange={(e) =>
              setFormData({ ...formData, agent_signature: e.target.value })
            }
            placeholder="Escribe tu nombre completo"
            required
            disabled={loading}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Confirma con tu firma que la situación está completada
          </p>
        </div>

        {/* Nombre del servicio */}
        <div>
          <Label htmlFor="service_name" className="text-sm font-medium text-gray-700">
            Nombre del Servicio <span className="text-red-500">*</span>
          </Label>
          <Input
            id="service_name"
            type="text"
            value={formData.service_name}
            onChange={(e) =>
              setFormData({ ...formData, service_name: e.target.value })
            }
            placeholder="Ej: Visado de Estudiante, Nacionalidad, etc."
            required
            disabled={loading}
            className="mt-1"
          />
        </div>

        {/* Grado del cliente */}
        <div>
          <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
            Grading <span className="text-red-500">*</span>
            {contact && (contact.grading_situacion || contact.grading_llamada) && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                (Pre-llenado desde contacto: {contact.grading_situacion || contact.grading_llamada})
              </span>
            )}
          </Label>
          <select
            id="grade"
            value={formData.grade}
            onChange={(e) =>
              setFormData({ ...formData, grade: e.target.value as 'A' | 'B' | 'C' })
            }
            disabled={loading}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="A">Grado A - 400 EUR</option>
            <option value="B">Grado B - 400 EUR</option>
            <option value="C">Grado C - 600 EUR</option>
          </select>
          {contact && (contact.grading_situacion || contact.grading_llamada) && (
            <p className="text-xs text-gray-500 mt-1">
              El grading se ha pre-llenado desde el contacto. Verifica que sea correcto.
            </p>
          )}
        </div>

        {/* Tipo de pago */}
        <div>
          <Label htmlFor="payment_type" className="text-sm font-medium text-gray-700">
            Forma de Pago <span className="text-red-500">*</span>
          </Label>
          <select
            id="payment_type"
            value={formData.payment_type}
            onChange={(e) =>
              setFormData({ ...formData, payment_type: e.target.value as 'deferred' | 'two_payments' })
            }
            disabled={loading}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="two_payments">En dos pagos</option>
            <option value="deferred">Aplazada</option>
          </select>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
        </div>

        {/* Nombre completo del cliente */}
        <div>
          <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
            Nombre Completo del Cliente <span className="text-red-500">*</span>
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

        {/* Copia de Pasaporte (Archivo) */}
        <div>
          <Label htmlFor="passport_file" className="text-sm font-medium text-gray-700">
            Copia de Pasaporte (Archivo)
          </Label>
          <div className="mt-1">
            <input
              ref={passportFileInputRef}
              id="passport_file"
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handlePassportFileChange}
              disabled={loading}
              className="hidden"
            />
            {!formData.passport_file ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => passportFileInputRef.current?.click()}
                disabled={loading}
                className="w-full"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Seleccionar archivo (JPG, PNG o PDF - máx. 10MB)
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <PhotoIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formData.passport_file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.passport_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removePassportFile}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            * Debe proporcionar al menos uno: número de pasaporte, NIE o copia de pasaporte
          </p>
        </div>

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

        {/* Provincia y Código Postal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_province" className="text-sm font-medium text-gray-700">
              Provincia <span className="text-red-500">*</span>
            </Label>
            <Input
              id="client_province"
              type="text"
              value={formData.client_province}
              onChange={(e) =>
                setFormData({ ...formData, client_province: e.target.value })
              }
              placeholder="Ej: Madrid"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="client_postal_code" className="text-sm font-medium text-gray-700">
              Código Postal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="client_postal_code"
              type="text"
              value={formData.client_postal_code}
              onChange={(e) =>
                setFormData({ ...formData, client_postal_code: e.target.value })
              }
              placeholder="Ej: 28001"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
