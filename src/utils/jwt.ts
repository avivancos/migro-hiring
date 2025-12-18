/**
 * Utilidades para manejo de tokens JWT
 * Decodifica y verifica la expiración de tokens JWT
 */

export interface JWTPayload {
  sub?: string;
  user_id?: string;
  email?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica un token JWT sin verificar la firma
 * @param token Token JWT
 * @returns Payload decodificado o null si el token es inválido
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token JWT inválido: no tiene 3 partes');
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Error decodificando token JWT:', error);
    return null;
  }
}

/**
 * Verifica si un token JWT está expirado
 * @param token Token JWT
 * @returns true si el token está expirado o es inválido, false si es válido
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Si no tiene exp, considerarlo expirado
  }

  // exp está en segundos, Date.now() está en milisegundos
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
}

/**
 * Verifica si un token JWT está cerca de expirar
 * @param token Token JWT
 * @param bufferMinutes Minutos de buffer antes de considerar que está cerca de expirar (default: 5)
 * @returns true si el token expirará en menos de bufferMinutes minutos
 */
export function isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Si no tiene exp, considerarlo expirado
  }

  // exp está en segundos, Date.now() está en milisegundos
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000; // Convertir minutos a milisegundos

  // Verificar si expirará en menos de bufferMinutes minutos
  return (expirationTime - currentTime) <= bufferTime;
}

/**
 * Obtiene el tiempo restante hasta la expiración del token en segundos
 * @param token Token JWT
 * @returns Tiempo restante en segundos, o null si el token es inválido o está expirado
 */
export function getTokenTimeRemaining(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const remaining = Math.floor((expirationTime - currentTime) / 1000);

  return remaining > 0 ? remaining : null;
}

