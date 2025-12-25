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
    performanceTracingService.setEnabled(true);
    performanceTracingService.setLogToConsole(true);
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
      const currentReport = performanceTracingService.getReport();

      // Log si hay métricas lentas
      if (showSlowOnly) {
        const slowMetrics = currentReport.metrics.filter(
          (m: PerformanceMetric) => m.duration && m.duration > slowThreshold
        );
        if (slowMetrics.length > 0) {
          console.group('🐌 Métricas Lentas Detectadas');
          slowMetrics.forEach((metric: PerformanceMetric) => {
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


