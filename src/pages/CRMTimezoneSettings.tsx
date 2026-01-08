// CRMTimezoneSettings - Configuración de zona horaria del usuario

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeftIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { timezoneService, type TimezoneOption, type TimezoneResponse } from '@/services/timezoneService';
import { getErrorMessage } from '@/services/api';

export function CRMTimezoneSettings() {
  const navigate = useNavigate();
  const [currentTimezone, setCurrentTimezone] = useState<string | null>(null);
  const [systemTimezone, setSystemTimezone] = useState<string>('Europe/Madrid');
  const [availableTimezones, setAvailableTimezones] = useState<TimezoneOption[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

  // Detectar timezone del navegador
  useEffect(() => {
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(browserTimezone);
    } catch (err) {
      console.warn('No se pudo detectar timezone del navegador:', err);
    }
  }, []);

  // Cargar timezone actual y lista disponible
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar timezone actual
      const currentData: TimezoneResponse = await timezoneService.getCurrentTimezone();
      setCurrentTimezone(currentData.timezone);
      setSystemTimezone(currentData.system_timezone);
      setSelectedTimezone(currentData.timezone || currentData.system_timezone);
      
      // Cargar lista de timezones disponibles
      const availableData = await timezoneService.getAvailableTimezones();
      setAvailableTimezones(availableData.timezones);
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(`Error al cargar configuración de timezone: ${errorMessage}`);
      console.error('Error loading timezone data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar timezones según búsqueda
  const filteredTimezones = availableTimezones.filter(tz =>
    tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Guardar timezone
  const handleSave = async () => {
    if (!selectedTimezone) {
      setError('Por favor selecciona una zona horaria');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const data: TimezoneResponse = await timezoneService.updateTimezone(selectedTimezone);
      setCurrentTimezone(data.timezone);
      setSuccess(true);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(`Error al guardar timezone: ${errorMessage}`);
      console.error('Error saving timezone:', err);
    } finally {
      setSaving(false);
    }
  };

  // Restablecer a timezone del sistema
  const handleReset = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const data: TimezoneResponse = await timezoneService.resetTimezone();
      setCurrentTimezone(null);
      setSelectedTimezone(data.system_timezone);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(`Error al restablecer timezone: ${errorMessage}`);
      console.error('Error resetting timezone:', err);
    } finally {
      setSaving(false);
    }
  };

  // Usar timezone detectado del navegador
  const handleUseDetected = () => {
    if (detectedTimezone) {
      // Verificar que el timezone detectado esté en la lista disponible
      const found = availableTimezones.find(tz => tz.code === detectedTimezone);
      if (found) {
        setSelectedTimezone(detectedTimezone);
      } else {
        setError(`Timezone detectado (${detectedTimezone}) no está disponible en la lista`);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">Cargando configuración de zona horaria...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/crm/settings')}
            className="p-2"
          >
            <ArrowLeftIcon width={20} height={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon width={28} height={28} />
              Configuración de Zona Horaria
            </h1>
            <p className="text-gray-600 mt-1">Configura tu zona horaria preferida para visualizar fechas y horas</p>
          </div>
        </div>

        {/* Información del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Zona horaria del sistema:</strong> {systemTimezone} (Madrid, España)
            </p>
            <p className="text-sm text-gray-600">
              El sistema procesa todas las fechas usando Madrid como referencia.
              Tu configuración personal solo afecta cómo se muestran las fechas en tu interfaz.
            </p>
          </CardContent>
        </Card>

        {/* Configuración de timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu Zona Horaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="timezone-search">Buscar zona horaria</Label>
              <Input
                id="timezone-search"
                type="text"
                placeholder="Buscar por nombre o código (ej: 'New York', 'Madrid')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              {detectedTimezone && detectedTimezone !== selectedTimezone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseDetected}
                  className="mt-2"
                >
                  Usar zona horaria detectada: {detectedTimezone}
                </Button>
              )}
            </div>

            {/* Selector de timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone-select">Selecciona tu zona horaria</Label>
              <select
                id="timezone-select"
                value={selectedTimezone}
                onChange={(e) => {
                  setSelectedTimezone(e.target.value);
                  setError(null);
                }}
                className="flex h-[44px] w-full rounded-lg border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-sans"
              >
                {filteredTimezones.length > 0 ? (
                  filteredTimezones.map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.name} ({tz.offset})
                    </option>
                  ))
                ) : (
                  <option value="">No se encontraron zonas horarias</option>
                )}
              </select>
              {currentTimezone && currentTimezone !== systemTimezone && (
                <p className="text-sm text-gray-500">
                  Actualmente configurado: {currentTimezone}
                </p>
              )}
              {!currentTimezone && (
                <p className="text-sm text-gray-500">
                  Usando zona horaria del sistema: {systemTimezone}
                </p>
              )}
            </div>

            {/* Mensajes de error/éxito */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <ExclamationCircleIcon width={16} height={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircleIcon width={16} height={16} />
                <span>¡Zona horaria actualizada correctamente!</span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving || selectedTimezone === currentTimezone || !selectedTimezone}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              {currentTimezone && currentTimezone !== systemTimezone && (
                <Button
                  onClick={handleReset}
                  disabled={saving}
                  variant="outline"
                >
                  Restablecer a {systemTimezone}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

