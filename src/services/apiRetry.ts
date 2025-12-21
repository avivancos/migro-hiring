// Utilidades para retry logic en llamadas API
// Manejo robusto de errores con reintentos exponenciales

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number; // en ms
  retryOn?: (error: any) => boolean; // Función para determinar si reintentar
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: (error: any) => {
    // Reintentar en errores de red o 5xx
    if (!error.response) return true; // Error de red
    const status = error.response?.status;
    return status >= 500 && status < 600;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // No reintentar si no cumple la condición
      if (!opts.retryOn(error)) {
        throw error;
      }

      // No reintentar en el último intento
      if (attempt === opts.maxRetries) {
        break;
      }

      // Delay exponencial: 1s, 2s, 4s...
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Helper para crear funciones con retry
export function createRetryableApiCall<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => apiCall(...args), options);
  }) as T;
}





