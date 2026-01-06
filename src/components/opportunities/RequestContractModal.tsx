// Modal para solicitar un código de contratación (hiring code)
// Se muestra cuando el agente quiere solicitar un contrato para avanzar con la venta

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
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
  payment_type: 'two_payments' | 'subscription';
  expires_in_days: number;
  currency: string;
  // Datos del cliente (obligatorios)
  client_name: string;
  client_passport: string;
  client_nie: string;
  client_address: string;
  client_province: string;
  client_postal_code: string;
}

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
  const [formData, setFormData] = useState<RequestContractForm>({
    agent_signature: '',
    contract_template: 'standard',
    service_name: opportunity?.pipeline_stage?.name || '',
    grade: 'B',
    payment_type: 'two_payments',
    expires_in_days: 30,
    currency: 'EUR',
    // Pre-llenar datos del cliente desde el contacto si están disponibles
    client_name: contact?.name || '',
    client_passport: '',
    client_nie: '',
    client_address: contact?.address || '',
    client_province: contact?.state || '',
    client_postal_code: contact?.postal_code || '',
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

    if (!formData.client_passport?.trim() && !formData.client_nie?.trim()) {
      setError('Debe proporcionar al menos un número de pasaporte o NIE');
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
      const backendPaymentType = formData.payment_type === 'two_payments' ? 'one_time' : 'subscription';

      const requestBody = {
        agent_signature: formData.agent_signature,
        contract_template: formData.contract_template,
        service_name: formData.service_name,
        grade: formData.grade,
        amount: gradePricing[formData.grade],
        payment_type: backendPaymentType,
        expires_in_days: formData.expires_in_days,
        currency: formData.currency,
        // Datos del cliente (obligatorios)
        client_name: formData.client_name,
        client_email: contact?.email || '',
        client_passport: formData.client_passport || undefined,
        client_nie: formData.client_nie || undefined,
        client_address: formData.client_address,
        client_province: formData.client_province,
        client_postal_code: formData.client_postal_code,
      };

      const response = await api.post(
        `/pipelines/stages/${entityType}/${entityId}/request-hiring-code`,
        requestBody
      );

      const result = response.data;
      setHiringCode(result.hiring_code);
      setSuccess(true);
      
      // Llamar al callback de éxito
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
      setFormData({
        agent_signature: '',
        contract_template: 'standard',
        service_name: opportunity?.pipeline_stage?.name || '',
        grade: 'B',
        payment_type: 'two_payments',
        expires_in_days: 30,
        currency: 'EUR',
        client_name: contact?.name || '',
        client_passport: '',
        client_nie: '',
        client_address: contact?.address || '',
        client_province: contact?.state || '',
        client_postal_code: contact?.postal_code || '',
      });
      onClose();
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
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
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
                <FileText className="h-4 w-4 mr-2" />
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
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
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
            Grado del Cliente <span className="text-red-500">*</span>
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
        </div>

        {/* Tipo de pago */}
        <div>
          <Label htmlFor="payment_type" className="text-sm font-medium text-gray-700">
            Tipo de Pago <span className="text-red-500">*</span>
          </Label>
          <select
            id="payment_type"
            value={formData.payment_type}
            onChange={(e) =>
              setFormData({ ...formData, payment_type: e.target.value as 'two_payments' | 'subscription' })
            }
            disabled={loading}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="two_payments">Dos Pagos</option>
            <option value="subscription">Suscripción</option>
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
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
