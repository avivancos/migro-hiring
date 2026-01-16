// Hook for managing Stripe payments

import { useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { hiringService } from '@/services/hiringService';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/constants';
import { getErrorMessage } from '@/services/api';

let stripePromise: Promise<Stripe | null> | null = null;

export function usePayment(code: string) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractUrl, setContractUrl] = useState<string>('');

  // Initialize Stripe
  const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
      if (!STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key no está configurada');
      }
      stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
  };

  // Create payment intent
  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = await hiringService.createPayment(code);

      setClientSecret(paymentData.client_secret);
      setPaymentIntentId(paymentData.payment_intent_id);

      return paymentData;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment and get contract
  const confirmPayment = async (paymentId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const id = paymentId || paymentIntentId;
      if (!id) {
        throw new Error('Payment Intent ID not available');
      }

      const result = await hiringService.confirmPayment(code, id);
      setContractUrl(result.contract_pdf_url);

      return result;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Download contract
  const downloadContract = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      await hiringService.downloadContractFile(code);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    clientSecret,
    paymentIntentId,
    contractUrl,
    loading,
    error,
    getStripe,
    createPaymentIntent,
    confirmPayment,
    downloadContract,
  };
}

