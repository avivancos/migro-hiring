/**
 * TokenStorage - Gestión centralizada de tokens de autenticación
 * 
 * Maneja el almacenamiento, verificación de expiración y renovación de tokens
 * usando los valores de expires_in del servidor (no valores hardcodeados)
 */

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;        // Tiempo de expiración del access token en segundos
  refresh_expires_in: number; // Tiempo de expiración del refresh token en segundos
}

class TokenStorage {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static TOKEN_EXPIRES_KEY = 'token_expires_at';
  private static REFRESH_EXPIRES_KEY = 'refresh_expires_at';
  
  /**
   * Guardar tokens después del login o refresh
   * IMPORTANTE: Usar expires_in del response, no valores hardcodeados
   */
  static saveTokens(tokens: TokenData): void {
    // Calcular timestamp de expiración usando expires_in del servidor
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const refreshExpiresAt = Date.now() + (tokens.refresh_expires_in * 1000);
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, String(expiresAt));
    localStorage.setItem(this.REFRESH_EXPIRES_KEY, String(refreshExpiresAt));
    
    // También guardar admin_token para compatibilidad con código existente
    localStorage.setItem('admin_token', tokens.access_token);
  }
  
  /**
   * Verificar si el access token está expirado
   * IMPORTANTE: Usar buffer de 2 minutos para refresh proactivo
   */
  static isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) return true;
    
    // Buffer de 2 minutos (120,000 ms) para refresh proactivo
    const bufferTime = 2 * 60 * 1000; // 2 minutos
    return Date.now() >= (parseInt(expiresAt) - bufferTime);
  }
  
  /**
   * Verificar si el refresh token está expirado
   */
  static isRefreshTokenExpired(): boolean {
    const refreshExpiresAt = localStorage.getItem(this.REFRESH_EXPIRES_KEY);
    if (!refreshExpiresAt) return true;
    
    return Date.now() >= parseInt(refreshExpiresAt);
  }
  
  /**
   * Obtener tiempo restante hasta expiración (en segundos)
   */
  static getTimeUntilExpiration(): number {
    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) return 0;
    
    const remaining = parseInt(expiresAt) - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
  
  /**
   * Obtener access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  /**
   * Obtener refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  /**
   * Limpiar todos los tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
    localStorage.removeItem(this.REFRESH_EXPIRES_KEY);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
  
  /**
   * Verificar si hay tokens almacenados
   */
  static hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }
}

export default TokenStorage;










