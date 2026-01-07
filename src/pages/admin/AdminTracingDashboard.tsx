// Admin Tracing Dashboard - Dashboard de análisis de rendimiento
// Analiza los logs de performanceTracingService para detectar módulos y partes lentas

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { performanceTracingService } from '@/services/performanceTracingService';
import type { PerformanceMetric } from '@/services/performanceTracingService';
import { usePerformanceReport } from '@/components/common/PerformanceMonitor';
import { 
  AlertTriangle,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  Globe,
  Code,
  Server,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export function AdminTracingDashboard() {
  const { Activity } = LucideIcons;

  const report = usePerformanceReport();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [slowThreshold] = useState(1000); // 1 segundo

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // El hook usePerformanceReport ya actualiza cada 5 segundos
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas de rendimiento...</p>
        </div>
      </div>
    );
  }

  // Análisis por módulos
  interface ModuleStats {
    totalCount: number;
    averageDuration: number;
    pages: PerformanceMetric[];
    components: PerformanceMetric[];
    apiCalls: PerformanceMetric[];
    slowestItems: PerformanceMetric[];
  }
  
  interface RouteStats {
    count: number;
    averageDuration: number;
    types: Record<string, number>;
  }
  
  const moduleAnalysis: Record<string, ModuleStats> = (performanceTracingService as any).getModuleAnalysis 
    ? (performanceTracingService as any).getModuleAnalysis()
    : {};
  
  // Análisis por rutas
  const routeAnalysis: Record<string, RouteStats> = (performanceTracingService as any).getRouteAnalysis
    ? (performanceTracingService as any).getRouteAnalysis()
    : {};

  // Detectar módulo de una ruta
  const getModuleFromRoute = (route?: string): string => {
    if (!route) return 'Otros';
    if (route.startsWith('/crm')) return 'CRM';
    if (route.startsWith('/admin')) return 'Admin';
    if (route.startsWith('/contratacion') || route.startsWith('/hiring')) return 'Contratación';
    if (route.startsWith('/auth') || route.startsWith('/login')) return 'Autenticación';
    return 'Otros';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSeverityColor = (duration: number) => {
    if (duration > 5000) return 'text-red-600 bg-red-50';
    if (duration > 2000) return 'text-orange-600 bg-orange-50';
    if (duration > 1000) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const handleClear = () => {
    performanceTracingService.clear();
    window.location.reload(); // Recargar para actualizar el reporte
  };

  const handleExport = () => {
    const exportData = performanceTracingService.exportMetrics();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const slowMetrics = report.metrics.filter(
    (m) => m.duration && m.duration > slowThreshold
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Tracing</h1>
          <p className="text-gray-600 mt-1">
            Análisis de rendimiento y detección de cuellos de botella
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-actualizar' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Métricas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.metrics.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Páginas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.totalPages}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Componentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.totalComponents}
                </p>
              </div>
              <Code className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">APIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.totalApiCalls}
                </p>
              </div>
              <Server className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis por Módulos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Análisis por Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(moduleAnalysis)
              .sort(([, a], [, b]) => (b as ModuleStats).averageDuration - (a as ModuleStats).averageDuration)
              .map(([module, stats]) => {
                const moduleStats = stats as ModuleStats;
                return (
                <div key={module} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{module}</h3>
                      <Badge variant="secondary">{moduleStats.totalCount} métricas</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Promedio</p>
                        <p className={`font-bold ${getSeverityColor(moduleStats.averageDuration)} px-2 py-1 rounded`}>
                          {formatDuration(moduleStats.averageDuration)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Páginas: {moduleStats.pages.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Componentes: {moduleStats.components.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">APIs: {moduleStats.apiCalls.length}</p>
                    </div>
                  </div>
                  {moduleStats.slowestItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Más lentos:</p>
                      <div className="space-y-1">
                        {moduleStats.slowestItems.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">
                              {item.name || item.componentName || item.apiEndpoint || 'N/A'}
                            </span>
                            <Badge variant={item.duration! > 2000 ? 'destructive' : 'secondary'} className="ml-2">
                              {formatDuration(item.duration!)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Páginas más lentas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Páginas Más Lentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.summary.slowestPages.length > 0 ? (
              report.summary.slowestPages.map((page, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getModuleFromRoute(page.route)}</Badge>
                    <div>
                      <p className="font-medium">{page.name}</p>
                      {page.route && (
                        <p className="text-xs text-gray-500">{page.route}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={page.duration! > 5000 ? 'destructive' : 'secondary'}
                    className="ml-4"
                  >
                    {formatDuration(page.duration!)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay páginas registradas</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Componentes más lentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            Componentes Más Lentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.summary.slowestComponents.length > 0 ? (
              report.summary.slowestComponents.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getModuleFromRoute(comp.route)}</Badge>
                    <div>
                      <p className="font-medium">{comp.componentName || comp.name}</p>
                      {comp.route && (
                        <p className="text-xs text-gray-500">{comp.route}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {formatDuration(comp.duration!)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay componentes registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* APIs más lentas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-orange-600" />
            APIs Más Lentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.summary.slowestApiCalls.length > 0 ? (
              report.summary.slowestApiCalls.map((api, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getModuleFromRoute(api.route)}</Badge>
                    <div>
                      <p className="font-medium">{api.apiEndpoint || api.name}</p>
                      {api.route && (
                        <p className="text-xs text-gray-500">{api.route}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={api.duration! > 2000 ? 'destructive' : 'secondary'}
                    className="ml-4"
                  >
                    {formatDuration(api.duration!)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay APIs registradas</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análisis por Rutas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Análisis por Rutas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(routeAnalysis)
              .slice(0, 10) // Mostrar solo las 10 más lentas
              .map(([route, stats]) => {
                const routeStats = stats as RouteStats;
                return (
                <div key={route} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getModuleFromRoute(route)}</Badge>
                      <p className="font-medium">{route}</p>
                    </div>
                    <Badge
                      variant={routeStats.averageDuration > 5000 ? 'destructive' : 'secondary'}
                    >
                      {formatDuration(routeStats.averageDuration)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{routeStats.count} métricas</span>
                    {Object.entries(routeStats.types).map(([type, count]) => (
                      <span key={type}>
                        {type}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
              );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Métricas lentas (alertas) */}
      {slowMetrics.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="w-5 h-5" />
              Alertas: Métricas Lentas ({slowMetrics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slowMetrics.slice(0, 20).map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {metric.type}
                    </Badge>
                    <span className="text-sm">
                      {metric.name || metric.componentName || metric.apiEndpoint || 'N/A'}
                    </span>
                  </div>
                  <Badge variant="destructive">
                    {formatDuration(metric.duration!)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

