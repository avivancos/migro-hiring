// Componente para monitorear y mostrar métricas de rendimiento
// Se puede usar en modo desarrollo o con un flag de configuración

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceTracingService, type PerformanceReport, type PerformanceMetric } from '@/services/performanceTracingService';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showSlowOnly?: boolean;
  slowThreshold?: number;
}

/**
 * Componente que monitorea el rendimiento de la aplicación
 * Muestra métricas en consola y puede mostrar alertas visuales
 */
export function PerformanceMonitor({
  enabled = import.meta.env.DEV, // Solo en desarrollo por defecto
  showSlowOnly = false,
  slowThreshold = 1000,
}: PerformanceMonitorProps) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    // Configurar servicio
    performanceTracingService.setEnabled(enabled);
    performanceTracingService.setLogToConsole(enabled && import.meta.env.DEV);
    performanceTracingService.setSlowThreshold(slowThreshold);

    // Medir tiempo de carga de página
    const pageMarkName = performanceTracingService.start(
      `page_${location.pathname}`,
      'page',
      { route: location.pathname }
    );

    // Finalizar cuando el componente se desmonta o cambia la ruta
    return () => {
      performanceTracingService.end(pageMarkName, 'success', { route: location.pathname });

      // Generar reporte actualizado (para uso futuro si es necesario)
      // Solo mostrar métricas de la página actual, no todas las acumuladas
      if (showSlowOnly && import.meta.env.DEV) {
        const currentReport = performanceTracingService.getReport();
        // Filtrar solo métricas de la página actual
        const currentPageMetrics = currentReport.metrics.filter(
          (m: PerformanceMetric) => 
            m.route === location.pathname && 
            m.duration && 
            m.duration > slowThreshold
        );
        if (currentPageMetrics.length > 0) {
          console.group(`🐌 Métricas Lentas - ${location.pathname}`);
          currentPageMetrics.forEach((metric: PerformanceMetric) => {
            console.warn(
              `${metric.type.toUpperCase()}: ${metric.name} - ${metric.duration?.toFixed(2)}ms`
            );
          });
          console.groupEnd();
        }
      }
    };
  }, [location.pathname, enabled, showSlowOnly, slowThreshold]);

  // No renderizar nada, solo monitorear
  return null;
}

/**
 * Hook para obtener reporte de rendimiento actual
 */
export function usePerformanceReport() {
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    const updateReport = () => {
      setReport(performanceTracingService.getReport());
    };

    // Actualizar reporte cada 5 segundos
    const interval = setInterval(updateReport, 5000);
    updateReport(); // Inicial

    return () => clearInterval(interval);
  }, []);

  return report;
}

