// Hook for fetching and managing hiring data

import { useState, useEffect, useCallback } from 'react';
import { hiringService } from '@/services/hiringService';
import type { HiringDetails } from '@/types/hiring';
import { getErrorMessage } from '@/services/api';

export function useHiringData(code: string) {
  const [details, setDetails] = useState<HiringDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!code) {
      setError('Código de contratación no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Obteniendo detalles para código:', code);
      const data = await hiringService.getDetails(code);
      console.log('📊 Datos recibidos del backend:', data);
      console.log('📊 Service name:', data.service_name);
      console.log('📊 Service description:', data.service_description);
      console.log('📊 Client name:', data.client_name);
      console.log('📊 Client email:', data.client_email);
      console.log('📊 Client passport:', data.user_passport);
      console.log('📊 Client NIE:', data.user_nie);
      console.log('📊 Client address:', data.user_address);
      console.log('📊 Client city:', data.user_city);
      console.log('📊 Client province:', data.user_province);
      console.log('📊 Client postal code:', data.user_postal_code);
      console.log('💰 Manual payment confirmed:', data.manual_payment_confirmed);
      console.log('💰 Manual payment note:', data.manual_payment_note);
      console.log('💰 Manual payment method:', data.manual_payment_method);
      console.log('📊 OBJETO COMPLETO:', JSON.stringify(data, null, 2));
      
      // Cargar anexos si no vienen en la respuesta
      if (!data.annexes || data.annexes.length === 0) {
        console.log('📎 useHiringData - No hay anexos en la respuesta, cargando desde backend...');
        try {
          const loadedAnnexes = await hiringService.getAnnexes(code);
          console.log('📎 useHiringData - Anexos recibidos:', loadedAnnexes.length, loadedAnnexes);
          if (loadedAnnexes.length > 0) {
            data.annexes = loadedAnnexes.map(a => ({ title: a.title, content: a.content }));
            console.log('✅ useHiringData - Anexos agregados a details:', data.annexes.length, data.annexes);
          } else {
            console.log('📎 useHiringData - No hay anexos para este contrato');
          }
        } catch (annexError: any) {
          console.error('❌ useHiringData - Error cargando anexos:', {
            message: annexError?.message,
            response: annexError?.response?.data,
            status: annexError?.response?.status
          });
          // Continuar sin anexos
        }
      } else {
        console.log('✅ useHiringData - Anexos ya incluidos en la respuesta:', data.annexes.length, data.annexes);
      }
      
      setDetails(data);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Load data on mount or when code changes
  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Get current step based on status
  const getCurrentStep = (): number => {
    if (!details) return 1;

    if (details.status === 'completed') return 5;
    if (details.status === 'paid') return 5;
    if (details.kyc_status === 'verified') return 4;
    if (details.kyc_status === 'pending') return 3;

    return 1;
  };

  // Check if code is expired
  const isExpired = (): boolean => {
    if (!details) return false;
    return new Date(details.expires_at) < new Date();
  };

  // Check if hiring is completed
  const isCompleted = (): boolean => {
    if (!details) return false;
    return details.status === 'completed';
  };

  return {
    details,
    loading,
    error,
    reload: loadDetails,
    getCurrentStep,
    isExpired,
    isCompleted,
  };
}

