// Hiring Service - All API endpoints for hiring flow

import { api } from './api';
import type {
  HiringDetails,
  ConfirmDataRequest,
  KYCSession,
  PaymentIntent,
  ContractResponse,
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
    
    const { data} = await api.post<KYCSession>(`/hiring/${code}/kyc/start`, {
      return_url: returnUrl || defaultReturnUrl,
    });
    return data;
  },

  /**
   * Step 3: Complete KYC verification
   */
  async completeKYC(code: string, sessionId: string): Promise<void> {
    await api.post(`/hiring/${code}/kyc/complete`, {
      session_id: sessionId,
    });
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
   * Step 5: Download contract PDF by hiring code
   */
  async downloadContract(code: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/hiring/${code}/contract/download`, {
      responseType: 'blob',
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

