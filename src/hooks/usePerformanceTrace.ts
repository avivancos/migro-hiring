// Hook para medir rendimiento de componentes
// Usa el servicio de tracing para medir tiempos de renderizado

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceTracingService } from '@/services/performanceTracingService';

interface UsePerformanceTraceOptions {
  componentName: string;
  enabled?: boolean;
  logSlowThreshold?: number; // Log si es más lento que este umbral (ms)
  metadata?: Record<string, any>;
}

/**
 * Hook para medir el tiempo de renderizado de un componente
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceTrace({ componentName: 'MyComponent' });
 *   return <div>Content</div>;
 * }
 * ```
 */
export function usePerformanceTrace({
  componentName,
  enabled = true,
  logSlowThreshold = 100,
  metadata,
}: UsePerformanceTraceOptions) {
  const location = useLocation();
  const markNameRef = useRef<string>('');
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current += 1;
    const isFirstRender = renderCountRef.current === 1;

    // Iniciar medición
    markNameRef.current = performanceTracingService.start(
      componentName,
      'component',
      {
        componentName,
        route: location.pathname,
        renderCount: renderCountRef.current,
        isFirstRender,
        ...metadata,
      }
    );

    // Finalizar medición después del render
    return () => {
      if (markNameRef.current) {
        const duration = performanceTracingService.end(markNameRef.current, 'success', {
          componentName,
          route: location.pathname,
          renderCount: renderCountRef.current,
        });

        // Log si es lento
        if (duration && duration > logSlowThreshold) {
          console.warn(
            `🐌 [Performance] Componente lento: "${componentName}" - ${duration.toFixed(2)}ms (ruta: ${location.pathname})`
          );
        }
      }
    };
  }, [componentName, location.pathname, enabled, logSlowThreshold, metadata]);
}

/**
 * Hook para medir el tiempo de carga de una página completa
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   usePagePerformanceTrace({ pageName: 'Dashboard' });
 *   return <div>Page content</div>;
 * }
 * ```
 */
export function usePagePerformanceTrace({
  pageName,
  enabled = true,
  metadata,
}: {
  pageName: string;
  enabled?: boolean;
  metadata?: Record<string, any>;
}) {
  const location = useLocation();
  const markNameRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    // Iniciar medición de carga de página
    markNameRef.current = performanceTracingService.start(`page_${pageName}`, 'page', {
      pageName,
      route: location.pathname,
      ...metadata,
    });

    // Finalizar cuando el componente se desmonta o cambia la ruta
    return () => {
      if (markNameRef.current) {
        performanceTracingService.end(markNameRef.current, 'success', {
          pageName,
          route: location.pathname,
        });
      }
    };
  }, [pageName, location.pathname, enabled, metadata]);
}

