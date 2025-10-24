// Validation utilities

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Email inválido');

/**
 * Hiring code validation schema (5 characters alphanumeric)
 */
export const hiringCodeSchema = z
  .string()
  .length(5, 'El código debe tener 5 caracteres')
  .regex(/^[A-Z0-9]{5}$/, 'El código debe ser alfanumérico en mayúsculas');

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Confirm data schema
 */
export const confirmDataSchema = z.object({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

/**
 * Validate hiring code format
 */
export function isValidHiringCode(code: string): boolean {
  try {
    hiringCodeSchema.parse(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

