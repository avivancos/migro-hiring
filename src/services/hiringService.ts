// Hiring Service - All API endpoints for hiring flow

import { api } from './api';
import type {
  HiringDetails,
  ConfirmDataRequest,
  KYCSession,
  PaymentIntent,
  ContractResponse,
  CheckoutResponse,
} from '@/types/hiring';

export const hiringService = {
  /**
   * Step 1: Get hiring details by code
   */
  async getDetails(code: string): Promise<HiringDetails> {
    const { data } = await api.get<HiringDetails>(`/hiring/${code}`);
    return data;
  },

  /**
   * Step 2: Confirm user data
   */
  async confirmData(code: string, request: ConfirmDataRequest): Promise<void> {
    await api.post(`/hiring/${code}/confirm-data`, request);
  },

  /**
   * Step 2: Accept contract - Upload signed contract PDF
   */
  async acceptContract(code: string, contractBlob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('contract', contractBlob, 'contrato.pdf');
    formData.append('accepted_at', new Date().toISOString());
    
    await api.post(`/hiring/${code}/contract/accept`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Step 3: Start KYC verification session
   */
  async startKYC(code: string, returnUrl?: string): Promise<KYCSession> {
    // Construir la URL de retorno completa
    const baseUrl = window.location.origin;
    const defaultReturnUrl = `${baseUrl}/contratacion/${code}`;
    
    console.log('🚀 Iniciando sesión KYC:');
    console.log('   URL:', `/hiring/${code}/kyc/start`);
    console.log('   Return URL:', returnUrl || defaultReturnUrl);
    
    const { data } = await api.post<KYCSession>(`/hiring/${code}/kyc/start`, {
      return_url: returnUrl || defaultReturnUrl,
    });
    
    console.log('📥 Respuesta de startKYC:');
    console.log('   Session ID:', data.session_id);
    console.log('   URL:', data.url);
    console.log('   Data completa:', data);
    
    return data;
  },

  /**
   * Step 3: Complete KYC verification
   */
  async completeKYC(code: string, sessionId: string): Promise<any> {
    console.log('📡 Enviando request a API:');
    console.log('   URL:', `/hiring/${code}/kyc/complete`);
    console.log('   Body:', { session_id: sessionId });
    
    const response = await api.post(`/hiring/${code}/kyc/complete`, {
      session_id: sessionId,
    });
    
    console.log('📥 Respuesta recibida de API:');
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    console.log('   Headers:', response.headers);
    
    return response.data;
  },

  /**
   * Step 4: Create payment intent
   */
  async createPayment(code: string): Promise<PaymentIntent> {
    const { data } = await api.post<PaymentIntent>(`/hiring/${code}/payment`);
    return data;
  },

  /**
   * Step 4: Confirm payment and generate contract
   */
  async confirmPayment(code: string, paymentIntentId: string): Promise<ContractResponse> {
    const { data } = await api.post<ContractResponse>(`/hiring/${code}/confirm`, {
      payment_intent_id: paymentIntentId,
    });
    return data;
  },

  /**
   * Step 5: Upload final contract and trigger email sending
   */
  async uploadFinalContract(formData: FormData): Promise<{ status: string; message: string }> {
    const { data } = await api.post<{ status: string; message: string }>(`/hiring/final-contract/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async createCheckoutSession(hiringCode: string): Promise<CheckoutResponse> {
    const { data } = await api.post<CheckoutResponse>(`/hiring/${hiringCode}/checkout`, {});
    return data;
  },

  /**
   * Step 5: Download contract PDF by hiring code
   * NOTA: Este endpoint devuelve el contrato del paso 3 (con firma pero puede ser borrador)
   * Para el contrato definitivo, usar downloadFinalContract()
   */
  async downloadContract(code: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/hiring/${code}/contract/download`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * Download final contract PDF (contrato definitivo sin marca de agua)
   * NOTA: Este endpoint devuelve un redirect (302) a Cloudinary
   */
  async downloadFinalContract(code: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/hiring/${code}/final-contract/download`, {
      responseType: 'blob',
      maxRedirects: 5, // Seguir redirecciones automáticamente
    });
    return data;
  },

  /**
   * Helper: Download contract and trigger browser download
   */
  async downloadContractFile(code: string, filename?: string): Promise<void> {
    const blob = await this.downloadContract(code);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `contrato-migro-${code}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

