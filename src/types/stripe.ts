// Types for Stripe admin billing summary

export interface StripePaymentMethodInfo {
  id?: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

export interface StripeCustomerInfo {
  id?: string;
  email?: string;
  name?: string;
}

export interface StripeSubscriptionInfo {
  id?: string;
  status?: string;
  current_period_start?: string | number;
  current_period_end?: string | number;
  cancel_at_period_end?: boolean;
}

export interface StripeInvoice {
  id: string;
  number?: string;
  status?: string;
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  created?: string | number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  payment_intent_id?: string;
}

export interface StripeTransaction {
  id: string;
  status?: string;
  amount?: number;
  currency?: string;
  created?: string | number;
  description?: string;
  payment_method?: string;
  invoice_id?: string;
  charge_id?: string;
}

export interface StripeBillingSummary {
  subscription?: StripeSubscriptionInfo | null;
  customer?: StripeCustomerInfo | null;
  default_payment_method?: StripePaymentMethodInfo | null;
  invoices?: StripeInvoice[];
  transactions?: StripeTransaction[];
}

export interface StripeBillingPortalSession {
  url: string;
}
