// Servicio de logging y tracing integrado con SQLite
import { localDatabase } from './localDatabase';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type TraceStatus = 'success' | 'error' | 'warning';

interface LogOptions {
  context?: string;
  user_id?: string;
  user_role?: string;
  route_path?: string;
  metadata?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
  duration_ms?: number;
  status?: string;
}

interface TraceOptions {
  user_id?: string;
  route_path?: string;
  metadata?: Record<string, any>;
}

class LoggingService {
  private traceIdCounter: number = 0;
  private activeTraces: Map<string, number> = new Map();

  /**
   * Genera un ID único para un trace
   */
  private generateTraceId(): string {
    this.traceIdCounter += 1;
    return `trace-${Date.now()}-${this.traceIdCounter}`;
  }

  /**
   * Genera un ID único para un span
   */
  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra un log
   */
  async log(
    level: LogLevel,
    message: string,
    options?: LogOptions
  ): Promise<void> {
    try {
      await localDatabase.log(level, message, options);
      
      // También loggear en consola en desarrollo
      if (import.meta.env.DEV) {
        const consoleMethod = level === 'error' ? 'error' : 
                             level === 'warn' ? 'warn' : 
                             level === 'debug' ? 'debug' : 'log';
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, options);
      }
    } catch (error) {
      console.error('Error guardando log:', error);
    }
  }

  /**
   * Métodos de conveniencia para diferentes niveles de log
   */
  async info(message: string, options?: LogOptions): Promise<void> {
    await this.log('info', message, options);
  }

  async warn(message: string, options?: LogOptions): Promise<void> {
    await this.log('warn', message, options);
  }

  async error(message: string, options?: LogOptions): Promise<void> {
    await this.log('error', message, options);
  }

  async debug(message: string, options?: LogOptions): Promise<void> {
    await this.log('debug', message, options);
  }

  /**
   * Inicia un trace
   */
  startTrace(operation: string, options?: TraceOptions): string {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const startTime = performance.now();

    this.activeTraces.set(traceId, startTime);

    // Loggear inicio del trace
    this.debug(`Iniciando trace: ${operation}`, {
      context: 'tracing',
      trace_id: traceId,
      span_id: spanId,
      ...options,
    });

    return traceId;
  }

  /**
   * Finaliza un trace
   */
  async endTrace(
    traceId: string,
    operation: string,
    status: TraceStatus = 'success',
    options?: TraceOptions
  ): Promise<void> {
    const startTime = this.activeTraces.get(traceId);
    if (!startTime) {
      console.warn(`Trace ${traceId} no encontrado`);
      return;
    }

    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const spanId = this.generateSpanId();

    this.activeTraces.delete(traceId);

    try {
      await localDatabase.trace(
        traceId,
        spanId,
        operation,
        durationMs,
        status,
        options
      );

      // Loggear fin del trace
      this.debug(`Trace finalizado: ${operation} (${durationMs.toFixed(2)}ms)`, {
        context: 'tracing',
        trace_id: traceId,
        span_id: spanId,
        duration_ms: durationMs,
        status,
        ...options,
      });
    } catch (error) {
      console.error('Error guardando trace:', error);
    }
  }

  /**
   * Wrapper para ejecutar una operación con tracing automático
   */
  async traceOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: TraceOptions
  ): Promise<T> {
    const traceId = this.startTrace(operation, options);
    
    try {
      const result = await fn();
      await this.endTrace(traceId, operation, 'success', options);
      return result;
    } catch (error) {
      await this.endTrace(traceId, operation, 'error', {
        ...options,
        metadata: {
          ...options?.metadata,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Obtiene logs con filtros
   */
  async getLogs(options?: {
    level?: LogLevel;
    limit?: number;
    offset?: number;
    route_path?: string;
    user_id?: string;
  }) {
    return await localDatabase.getLogs(options);
  }

  /**
   * Obtiene traces con filtros
   */
  async getTraces(options?: {
    trace_id?: string;
    limit?: number;
    offset?: number;
    route_path?: string;
    user_id?: string;
    status?: TraceStatus;
  }) {
    return await localDatabase.getTraces(options);
  }

  /**
   * Limpia logs antiguos
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    await localDatabase.clearOldLogs(daysToKeep);
  }

  /**
   * Limpia traces antiguos
   */
  async clearOldTraces(daysToKeep: number = 30): Promise<void> {
    await localDatabase.clearOldTraces(daysToKeep);
  }
}

export const loggingService = new LoggingService();

/**
 * Hook para logging con contexto de usuario automático
 */
export function useLogging() {
  // Nota: No podemos usar useAuth aquí directamente porque esto es un servicio
  // En su lugar, el usuario debe pasar el contexto cuando sea necesario
  
  return {
    log: loggingService.log.bind(loggingService),
    info: loggingService.info.bind(loggingService),
    warn: loggingService.warn.bind(loggingService),
    error: loggingService.error.bind(loggingService),
    debug: loggingService.debug.bind(loggingService),
    startTrace: loggingService.startTrace.bind(loggingService),
    endTrace: loggingService.endTrace.bind(loggingService),
    traceOperation: loggingService.traceOperation.bind(loggingService),
    getLogs: loggingService.getLogs.bind(loggingService),
    getTraces: loggingService.getTraces.bind(loggingService),
  };
}




