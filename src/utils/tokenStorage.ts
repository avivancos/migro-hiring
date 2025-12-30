/**
 * TokenStorage - Gestión centralizada de tokens de autenticación
 * 
 * Maneja el almacenamiento, verificación de expiración y renovación de tokens
 * usando los valores de expires_in del servidor (no valores hardcodeados)
 * 
 * ⚠️ CRÍTICO: Los tokens se guardan en MÚLTIPLES lugares para máxima persistencia:
 * - localStorage (principal, para acceso rápido desde JavaScript)
 * - Cookies (persistencia adicional, 15 días)
 * - sessionStorage (backup adicional)
 * 
 * La sesión dura 15 días y los tokens NUNCA se descartan en errores temporales.
 */

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;        // Tiempo de expiración del access token en segundos
  refresh_expires_in: number; // Tiempo de expiración del refresh token en segundos
}

class TokenStorage {
  // Usar prefijo migro_ para evitar conflictos con otras aplicaciones
  private static ACCESS_TOKEN_KEY = 'migro_access_token';
  private static REFRESH_TOKEN_KEY = 'migro_refresh_token';
  private static TOKEN_EXPIRES_KEY = 'migro_token_expires_at';
  private static REFRESH_EXPIRES_KEY = 'migro_refresh_expires_at';
  
  // Duración de sesión: 15 días (en días para cookies)
  private static SESSION_DURATION_DAYS = 15;
  
  /**
   * ⚠️ CRÍTICO: Guardar tokens en MÚLTIPLES lugares
   * - localStorage: Para acceso rápido desde JS
   * - Cookies: Para persistencia y envío automático (15 días)
   * - sessionStorage: Como backup adicional
   * 
   * IMPORTANTE: Usar expires_in del response, no valores hardcodeados
   */
  static saveTokens(tokens: TokenData): void {
    // Calcular timestamp de expiración usando expires_in del servidor
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const refreshExpiresAt = Date.now() + (tokens.refresh_expires_in * 1000);
    
    // 1. Guardar en localStorage (principal)
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, String(expiresAt));
    localStorage.setItem(this.REFRESH_EXPIRES_KEY, String(refreshExpiresAt));
    
    // También guardar admin_token para compatibilidad con código existente
    localStorage.setItem('admin_token', tokens.access_token);
    
    // 2. Guardar en cookies (persistencia adicional, 15 días)
    this.setCookie(this.ACCESS_TOKEN_KEY, tokens.access_token, this.SESSION_DURATION_DAYS);
    this.setCookie(this.REFRESH_TOKEN_KEY, tokens.refresh_token, 30); // Refresh token 30 días
    this.setCookie(this.TOKEN_EXPIRES_KEY, String(expiresAt), this.SESSION_DURATION_DAYS);
    this.setCookie(this.REFRESH_EXPIRES_KEY, String(refreshExpiresAt), 30);
    
    // 3. Guardar en sessionStorage como backup
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  
  /**
   * Helper para setear cookies
   */
  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const secure = window.location.protocol === 'https:';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure ? ';Secure' : ''}`;
  }
  
  /**
   * Helper para obtener cookies
   */
  private static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  
  /**
   * Helper para eliminar cookies
   */
  private static deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
  
  /**
   * ⚠️ CRÍTICO: Verificar si el token está expirado
   * NO considerar expirado hasta que realmente lo esté
   * Buffer de solo 1 minuto (mínimo necesario)
   * Lee de múltiples fuentes: localStorage → cookies → sessionStorage
   */
  static isTokenExpired(): boolean {
    // Intentar obtener expires_at de múltiples fuentes
    let expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) {
      expiresAt = this.getCookie(this.TOKEN_EXPIRES_KEY);
    }
    if (!expiresAt) {
      expiresAt = sessionStorage.getItem(this.TOKEN_EXPIRES_KEY);
    }
    
    if (!expiresAt) return true;
    
    // Buffer de solo 1 minuto (mínimo necesario)
    // NO usar buffers grandes que causen refresh prematuro
    const bufferTime = 60 * 1000; // 1 minuto
    return Date.now() >= (parseInt(expiresAt) - bufferTime);
  }
  
  /**
   * Verificar si el refresh token está expirado
   * Lee de múltiples fuentes: localStorage → cookies → sessionStorage
   */
  static isRefreshTokenExpired(): boolean {
    let refreshExpiresAt = localStorage.getItem(this.REFRESH_EXPIRES_KEY);
    if (!refreshExpiresAt) {
      refreshExpiresAt = this.getCookie(this.REFRESH_EXPIRES_KEY);
    }
    if (!refreshExpiresAt) {
      refreshExpiresAt = sessionStorage.getItem(this.REFRESH_EXPIRES_KEY);
    }
    
    if (!refreshExpiresAt) return true;
    
    return Date.now() >= parseInt(refreshExpiresAt);
  }
  
  /**
   * Obtener tiempo restante hasta expiración (en segundos)
   * Lee de múltiples fuentes: localStorage → cookies → sessionStorage
   */
  static getTimeUntilExpiration(): number {
    let expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) {
      expiresAt = this.getCookie(this.TOKEN_EXPIRES_KEY);
    }
    if (!expiresAt) {
      expiresAt = sessionStorage.getItem(this.TOKEN_EXPIRES_KEY);
    }
    
    if (!expiresAt) return 0;
    
    const remaining = parseInt(expiresAt) - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
  
  /**
   * Obtener access token (intentar múltiples fuentes)
   * 1. localStorage (principal)
   * 2. cookies (fallback)
   * 3. sessionStorage (último recurso)
   * Si encuentra en cookies o sessionStorage, restaura en localStorage
   */
  static getAccessToken(): string | null {
    // 1. Intentar localStorage primero
    let token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (token) return token;
    
    // 2. Intentar cookies
    token = this.getCookie(this.ACCESS_TOKEN_KEY);
    if (token) {
      // Restaurar en localStorage si se encontró en cookies
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      console.log('🔄 Token restaurado desde cookies a localStorage');
      return token;
    }
    
    // 3. Intentar sessionStorage como último recurso
    token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (token) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      console.log('🔄 Token restaurado desde sessionStorage a localStorage');
      return token;
    }
    
    return null;
  }
  
  /**
   * Obtener refresh token (intentar múltiples fuentes)
   * 1. localStorage (principal)
   * 2. cookies (fallback)
   * 3. sessionStorage (último recurso)
   * Si encuentra en cookies o sessionStorage, restaura en localStorage
   */
  static getRefreshToken(): string | null {
    // 1. Intentar localStorage primero
    let token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (token) return token;
    
    // 2. Intentar cookies
    token = this.getCookie(this.REFRESH_TOKEN_KEY);
    if (token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      console.log('🔄 Refresh token restaurado desde cookies a localStorage');
      return token;
    }
    
    // 3. Intentar sessionStorage
    token = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      console.log('🔄 Refresh token restaurado desde sessionStorage a localStorage');
      return token;
    }
    
    return null;
  }
  
  /**
   * ⚠️ CRÍTICO: Limpiar tokens SOLO cuando sea absolutamente necesario
   * (ej: logout explícito, refresh token expirado definitivamente)
   * 
   * Limpia localStorage, cookies y sessionStorage para asegurar que la sesión se cierre completamente.
   */
  static clearTokens(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
    localStorage.removeItem(this.REFRESH_EXPIRES_KEY);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Limpiar cookies
    this.deleteCookie(this.ACCESS_TOKEN_KEY);
    this.deleteCookie(this.REFRESH_TOKEN_KEY);
    this.deleteCookie(this.TOKEN_EXPIRES_KEY);
    this.deleteCookie(this.REFRESH_EXPIRES_KEY);
    this.deleteCookie('admin_token');
    
    // Limpiar sessionStorage
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    
    console.log('🧹 Tokens limpiados de localStorage, cookies y sessionStorage');
  }
  
  /**
   * Verificar si hay tokens almacenados
   * Verifica múltiples fuentes: localStorage → cookies → sessionStorage
   */
  static hasTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!accessToken && !!refreshToken;
  }
  
  /**
   * ⚠️ CRÍTICO: Verificar si hay tokens válidos en cualquier fuente
   * Si hay refresh token válido, considerar que hay sesión
   * Si hay access token válido, considerar que hay sesión
   */
  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    // Si hay refresh token válido, considerar que hay sesión
    if (refreshToken && !this.isRefreshTokenExpired()) {
      return true;
    }
    
    // Si hay access token válido, considerar que hay sesión
    if (accessToken && !this.isTokenExpired()) {
      return true;
    }
    
    return false;
  }
}

export default TokenStorage;
















