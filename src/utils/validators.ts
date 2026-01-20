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

/**
 * Sanitize string by removing dangerous characters
 * Removes null bytes, control characters, and other potentially dangerous characters
 */
export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  return value
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n, \r, \t
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .trim();
}

/**
 * Validate email format strictly (more strict than HTML5 email validation)
 * Rejects emails like test..test@test.com, test@test.c, etc.
 */
export function isValidEmailStrict(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex (more strict than HTML5)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Reject emails with consecutive dots
  if (email.includes('..')) return false;
  
  // Reject emails with dot at start or end of local part
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  
  // Reject domains with less than 2 characters after last dot
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  return true;
}

/**
 * Check if string contains XSS patterns
 */
export function containsXSS(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /javascript:/gi,
    /<svg[^>]*onload[^>]*>/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, etc.
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Sanitize string to prevent XSS (removes HTML tags and dangerous attributes)
 */
export function sanitizeXSS(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // Remove script tags and dangerous HTML
  let sanitized = value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<img[^>]*onerror[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<svg[^>]*onload[^>]*>/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Validate name: must not be empty after trim, must not exceed maxLength
 */
export function isValidName(name: string, maxLength: number = 255): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > maxLength) return false;
  return true;
}

