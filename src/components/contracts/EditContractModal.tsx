// EditContractModal - Modal completo para editar contratos
import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { contractsService } from '@/services/contractsService';
import type { Contract, ContractUpdateRequest } from '@/types/contracts';
import { formatCurrency } from '@/utils/formatters';

interface EditContractModalProps {
  contract: Contract;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (updatedContract: Contract) => void;
}

/**
 * Convertir euros a centavos
 */
function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convertir centavos a euros
 */
function centsToEuros(cents: number): number {
  return cents / 100;
}

export function EditContractModal({
  contract,
  visible,
  onClose,
  onSuccess,
}: EditContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Estado y configuración
    status: contract?.status || 'pending',
    payment_type: contract?.payment_type || 'one_time',
    grade: contract?.grade || undefined,
    currency: contract?.currency || 'EUR',
    amount: contract ? centsToEuros(contract.amount) : 0,
    kyc_status: contract?.kyc_status || null,

    // Cliente
    client_name: contract?.client_name || '',
    client_email: contract?.client_email || '',
    client_passport: contract?.client_passport || '',
    client_nie: contract?.client_nie || '',
    client_nationality: contract?.client_nationality || '',
    client_address: contract?.client_address || '',
    client_city: contract?.client_city || '',
    client_province: contract?.client_province || '',
    client_postal_code: contract?.client_postal_code || '',

    // Servicio
    service_name: contract?.service_name || '',
    service_description: contract?.service_description || '',

    // Pago manual
    manual_payment_confirmed: contract?.manual_payment_confirmed || false,
    manual_payment_method: contract?.manual_payment_method || '',
    manual_payment_note: contract?.manual_payment_note || '',

    // Suscripción
    subscription_id: contract?.subscription_id || '',
    subscription_status: contract?.subscription_status || '',

    // Expiración
    expires_in_days: 30,
  });

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (visible && contract) {
      // Calcular días hasta expiración
      const expiresAt = new Date(contract.expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      setFormData({
        // Estado y configuración
        status: contract.status,
        payment_type: contract.payment_type || 'one_time',
        grade: contract.grade,
        currency: contract.currency || 'EUR',
        amount: centsToEuros(contract.amount),
        kyc_status: contract.kyc_status || null,

        // Cliente
        client_name: contract.client_name,
        client_email: contract.client_email,
        client_passport: contract.client_passport || '',
        client_nie: contract.client_nie || '',
        client_nationality: contract.client_nationality || '',
        client_address: contract.client_address || '',
        client_city: contract.client_city || '',
        client_province: contract.client_province || '',
        client_postal_code: contract.client_postal_code || '',

        // Servicio
        service_name: contract.service_name,
        service_description: contract.service_description || '',

        // Pago manual
        manual_payment_confirmed: contract.manual_payment_confirmed || false,
        manual_payment_method: contract.manual_payment_method || '',
        manual_payment_note: contract.manual_payment_note || '',

        // Suscripción
        subscription_id: contract.subscription_id || '',
        subscription_status: contract.subscription_status || '',

        // Expiración
        expires_in_days: daysUntilExpiry > 0 ? daysUntilExpiry : 30,
      });
    }
  }, [visible, contract]);

  const handleSubmit = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      // Preparar request
      const updateRequest: ContractUpdateRequest = {
        status: formData.status,
        payment_type: formData.payment_type,
        grade: formData.grade,
        currency: formData.currency,
        amount: formData.amount ? eurosToCents(formData.amount) : undefined,
        kyc_status: formData.kyc_status !== null ? formData.kyc_status : undefined,

        client_name: formData.client_name || undefined,
        client_email: formData.client_email || undefined,
        client_passport: formData.client_passport || undefined,
        client_nie: formData.client_nie || undefined,
        client_nationality: formData.client_nationality || undefined,
        client_address: formData.client_address || undefined,
        client_city: formData.client_city || undefined,
        client_province: formData.client_province || undefined,
        client_postal_code: formData.client_postal_code || undefined,

        service_name: formData.service_name || undefined,
        service_description: formData.service_description || undefined,

        manual_payment_confirmed: formData.manual_payment_confirmed,
        manual_payment_method: formData.manual_payment_method || undefined,
        manual_payment_note: formData.manual_payment_note || undefined,

        subscription_id: formData.subscription_id || undefined,
        subscription_status: formData.subscription_status || undefined,

        expires_in_days: formData.expires_in_days || undefined,
      };

      const updatedContract = await contractsService.updateContract(
        contract.hiring_code,
        updateRequest
      );

      onSuccess?.(updatedContract);
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar contrato:', error);
      const errorMessage =
        error.response?.data?.detail || error.message || 'Error al actualizar el contrato';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      open={visible}
      onClose={handleCancel}
      title={`Editar Contrato: ${contract?.hiring_code || ''}`}
      size="xl"
      footer={
        <>
          <Button onClick={handleCancel} variant="outline" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Estado y Configuración */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Estado y Configuración
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Estado *</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="completed">Completado</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <Label htmlFor="payment_type">Tipo de Pago *</Label>
              <select
                id="payment_type"
                value={formData.payment_type}
                onChange={(e) => updateField('payment_type', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="one_time">Pago Único (2 cuotas)</option>
                <option value="subscription">Suscripción (10 pagos)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="grade">Grado</Label>
              <select
                id="grade"
                value={formData.grade || ''}
                onChange={(e) => updateField('grade', e.target.value || undefined)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="T">T (Test)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Moneda *</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <Label htmlFor="amount">Monto Total (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
              {contract && (
                <p className="text-xs text-gray-500 mt-1">
                  Actual: {formatCurrency(contract.amount, contract.currency)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="kyc_status">Estado KYC</Label>
              <select
                id="kyc_status"
                value={formData.kyc_status === null ? '' : formData.kyc_status}
                onChange={(e) =>
                  updateField('kyc_status', e.target.value || null)
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">No iniciado</option>
                <option value="pending">Pendiente</option>
                <option value="verified">Verificado</option>
                <option value="failed">Fallido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_name">Nombre *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => updateField('client_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="client_email">Email *</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => updateField('client_email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="client_passport">Pasaporte</Label>
              <Input
                id="client_passport"
                value={formData.client_passport}
                onChange={(e) => updateField('client_passport', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="client_nie">NIE</Label>
              <Input
                id="client_nie"
                value={formData.client_nie}
                onChange={(e) => updateField('client_nie', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="client_nationality">Nacionalidad</Label>
              <Input
                id="client_nationality"
                value={formData.client_nationality}
                onChange={(e) => updateField('client_nationality', e.target.value)}
                placeholder="Ej: Española, Colombiana"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="client_address">Dirección</Label>
              <Input
                id="client_address"
                value={formData.client_address}
                onChange={(e) => updateField('client_address', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="client_city">Ciudad</Label>
              <Input
                id="client_city"
                value={formData.client_city}
                onChange={(e) => updateField('client_city', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="client_province">Provincia</Label>
              <Input
                id="client_province"
                value={formData.client_province}
                onChange={(e) => updateField('client_province', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="client_postal_code">Código Postal</Label>
              <Input
                id="client_postal_code"
                value={formData.client_postal_code}
                onChange={(e) => updateField('client_postal_code', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Servicio */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Servicio
          </h3>
          <div>
            <Label htmlFor="service_name">Nombre del Servicio *</Label>
            <Input
              id="service_name"
              value={formData.service_name}
              onChange={(e) => updateField('service_name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="service_description">Descripción</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) => updateField('service_description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Pago Manual */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Pago Manual
          </h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="manual_payment_confirmed"
              checked={formData.manual_payment_confirmed}
              onChange={(e) =>
                updateField('manual_payment_confirmed', e.target.checked)
              }
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Label htmlFor="manual_payment_confirmed" className="cursor-pointer">
              Pago Confirmado
            </Label>
          </div>

          <div>
            <Label htmlFor="manual_payment_method">Método de Pago</Label>
            <Input
              id="manual_payment_method"
              value={formData.manual_payment_method}
              onChange={(e) => updateField('manual_payment_method', e.target.value)}
              placeholder="Ej: Transferencia bancaria, Efectivo"
            />
          </div>

          <div>
            <Label htmlFor="manual_payment_note">Nota de Pago</Label>
            <Textarea
              id="manual_payment_note"
              value={formData.manual_payment_note}
              onChange={(e) => updateField('manual_payment_note', e.target.value)}
              placeholder="Notas adicionales sobre el pago"
              rows={2}
            />
          </div>
        </div>

        {/* Suscripción (condicional) */}
        {formData.payment_type === 'subscription' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Suscripción
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscription_id">ID de Suscripción</Label>
                <Input
                  id="subscription_id"
                  value={formData.subscription_id}
                  onChange={(e) => updateField('subscription_id', e.target.value)}
                  placeholder="Stripe subscription ID"
                />
              </div>

              <div>
                <Label htmlFor="subscription_status">Estado de Suscripción</Label>
                <select
                  id="subscription_status"
                  value={formData.subscription_status}
                  onChange={(e) => updateField('subscription_status', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="active">Activa</option>
                  <option value="canceled">Cancelada</option>
                  <option value="past_due">Pago Pendiente</option>
                  <option value="unpaid">No Pagada</option>
                  <option value="incomplete">Incompleta</option>
                  <option value="trialing">En Prueba</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Expiración */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Expiración
          </h3>
          <div>
            <Label htmlFor="expires_in_days">Días hasta Expiración</Label>
            <Input
              id="expires_in_days"
              type="number"
              min="1"
              max="365"
              value={formData.expires_in_days}
              onChange={(e) =>
                updateField('expires_in_days', parseInt(e.target.value) || 30)
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Debe estar entre 1 y 365 días
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
