// Utilidades para validar búsquedas exactas por teléfono o email

/**
 * Valida si un string es un email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida si un string es un teléfono válido (formato flexible)
 * Acepta números con o sin espacios, guiones, paréntesis, prefijos internacionales
 */
export function isValidPhone(phone: string): boolean {
  // Limpiar el teléfono de espacios, guiones, paréntesis, etc.
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Debe tener entre 7 y 15 dígitos (estándar internacional)
  // Y debe contener solo dígitos después de limpiar
  const phoneRegex = /^\d{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Determina si una búsqueda es un dato exacto (email o teléfono)
 * Esto permite búsquedas más permisivas para agentes cuando tienen el dato exacto
 */
export function isExactSearch(searchTerm: string): {
  isExact: boolean;
  type: 'email' | 'phone' | 'none';
} {
  const trimmed = searchTerm.trim();
  
  if (isValidEmail(trimmed)) {
    return { isExact: true, type: 'email' };
  }
  
  if (isValidPhone(trimmed)) {
    return { isExact: true, type: 'phone' };
  }
  
  return { isExact: false, type: 'none' };
}

/**
 * Verifica si el usuario es agente
 */
export function isAgent(userRole: string | undefined): boolean {
  return userRole === 'agent';
}

/**
 * Verifica si el usuario es admin o superuser
 */
export function isAdminOrSuperuser(userRole: string | undefined, isSuperuser?: boolean): boolean {
  return userRole === 'admin' || userRole === 'superuser' || isSuperuser === true;
}





