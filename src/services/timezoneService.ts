// Timezone Service - API calls for timezone configuration

import { api } from './api';

// Tipos de datos
export interface TimezoneOption {
  code: string;      // Ej: "America/New_York"
  name: string;      // Ej: "Nueva York (Estados Unidos)"
  offset: string;    // Ej: "-05:00"
}

export interface TimezoneResponse {
  timezone: string | null;  // null si no está configurado
  system_timezone: string;  // Siempre "Europe/Madrid"
}

export interface TimezoneListResponse {
  timezones: TimezoneOption[];
}

export interface TimezoneUpdate {
  timezone: string;  // Ej: "America/New_York"
}

// Base path para endpoints de timezone
// Según documentación: /api/v1/timezone/
const TIMEZONE_BASE_PATH = '/v1/timezone';

export const timezoneService = {
  /**
   * Obtener timezone actual del usuario
   * GET /api/v1/timezone/
   */
  async getCurrentTimezone(): Promise<TimezoneResponse> {
    const { data } = await api.get<TimezoneResponse>(TIMEZONE_BASE_PATH + '/');
    return data;
  },

  /**
   * Obtener lista de timezones disponibles
   * GET /api/v1/timezone/available
   */
  async getAvailableTimezones(): Promise<TimezoneListResponse> {
    const { data } = await api.get<TimezoneListResponse>(TIMEZONE_BASE_PATH + '/available');
    return data;
  },

  /**
   * Actualizar timezone del usuario
   * PUT /api/v1/timezone/
   */
  async updateTimezone(timezone: string): Promise<TimezoneResponse> {
    const payload: TimezoneUpdate = { timezone };
    const { data } = await api.put<TimezoneResponse>(TIMEZONE_BASE_PATH + '/', payload);
    return data;
  },

  /**
   * Restablecer timezone a la del sistema
   * DELETE /api/v1/timezone/
   */
  async resetTimezone(): Promise<TimezoneResponse> {
    const { data } = await api.delete<TimezoneResponse>(TIMEZONE_BASE_PATH + '/');
    return data;
  },
};

