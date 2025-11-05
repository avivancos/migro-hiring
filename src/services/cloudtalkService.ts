// CloudTalk Service - Integration with CloudTalk API

import { CallCreateRequest } from '@/types/crm';
import { crmService } from './crmService';

export const cloudtalkService = {
  /**
   * Iniciar una llamada (click-to-call) con CloudTalk
   */
  async makeCall(phoneNumber: string, entityType: 'lead' | 'contact', entityId: number): Promise<void> {
    // CloudTalk Click-to-call via Widget API
    // Referencia: https://www.cloudtalk.io/developers/widget-api
    
    if (window.CloudTalk && window.CloudTalk.makeCall) {
      try {
        await window.CloudTalk.makeCall(phoneNumber);
        console.log(`✅ Llamada iniciada a ${phoneNumber}`);
      } catch (error) {
        console.error('Error iniciando llamada con CloudTalk:', error);
        // Fallback: abrir tel: link
        window.location.href = `tel:${phoneNumber}`;
      }
    } else {
      console.warn('CloudTalk Widget no disponible, usando tel: link');
      window.location.href = `tel:${phoneNumber}`;
    }
  },

  /**
   * Obtener URL de grabación de CloudTalk
   */
  async getRecordingUrl(callId: string): Promise<string | null> {
    try {
      // Esta función debería llamar a la API de CloudTalk si tienes acceso directo
      // Por ahora, la grabación se guarda cuando CloudTalk envía el webhook
      const call = await crmService.getCalls({ entity_type: 'lead' });
      const matchingCall = call.find(c => c.cloudtalk_id === callId);
      return matchingCall?.recording_url || null;
    } catch (error) {
      console.error('Error obteniendo grabación:', error);
      return null;
    }
  },

  /**
   * Registrar manualmente una llamada en el CRM
   */
  async logCall(callData: CallCreateRequest): Promise<void> {
    try {
      await crmService.createCall(callData);
      console.log('✅ Llamada registrada en CRM');
    } catch (error) {
      console.error('Error registrando llamada:', error);
      throw error;
    }
  },

  /**
   * Inicializar Widget de CloudTalk
   */
  initWidget(apiKey: string, userId?: string): void {
    if (typeof window === 'undefined') return;

    // Cargar script de CloudTalk Widget si no existe
    if (!document.getElementById('cloudtalk-widget')) {
      const script = document.createElement('script');
      script.id = 'cloudtalk-widget';
      script.src = 'https://www.cloudtalk.io/widget/loader.js';
      script.async = true;
      script.onload = () => {
        // Configurar widget
        if (window.CloudTalk) {
          window.CloudTalk.init({
            apiKey: apiKey,
            userId: userId,
            position: 'bottom-right',
          });
          console.log('✅ CloudTalk Widget inicializado');
        }
      };
      document.body.appendChild(script);
    }
  },

  /**
   * Destruir Widget de CloudTalk
   */
  destroyWidget(): void {
    if (window.CloudTalk && window.CloudTalk.destroy) {
      window.CloudTalk.destroy();
    }
    const script = document.getElementById('cloudtalk-widget');
    if (script) {
      script.remove();
    }
  },
};

// Tipos para TypeScript (CloudTalk Widget API)
declare global {
  interface Window {
    CloudTalk?: {
      init: (config: { apiKey: string; userId?: string; position?: string }) => void;
      makeCall: (phoneNumber: string) => Promise<void>;
      destroy: () => void;
    };
  }
}

export default cloudtalkService;

