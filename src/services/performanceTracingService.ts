// Performance Tracing Service
// Sistema de monitoreo de rendimiento para detectar cuellos de botella

export interface PerformanceMetric {
  name: string;
  type: 'page' | 'component' | 'api' | 'render' | 'custom';
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  route?: string;
  componentName?: string;
  apiEndpoint?: string;
  status?: 'success' | 'error' | 'warning';
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalPages: number;
    totalComponents: number;
    totalApiCalls: number;
    averagePageLoad: number;
    averageComponentRender: number;
    averageApiCall: number;
    slowestPages: PerformanceMetric[];
    slowestComponents: PerformanceMetric[];
    slowestApiCalls: PerformanceMetric[];
  };
}

class PerformanceTracingService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Límite de métricas en memoria
  private enabled = true;
  private logToConsole = import.meta.env.DEV; // Solo en desarrollo
  private logSlowThreshold = 3000; // Log métricas lentas > 3s (aumentado para reducir ruido)

  /**
   * Habilitar o deshabilitar el tracing
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Configurar si se loguea a consola
   */
  setLogToConsole(log: boolean) {
    this.logToConsole = log;
  }

  /**
   * Configurar umbral para considerar métricas lentas (ms)
   */
  setSlowThreshold(threshold: number) {
    this.logSlowThreshold = threshold;
  }

  /**
   * Iniciar medición
   */
  start(name: string, type: PerformanceMetric['type'], metadata?: Record<string, any>): string {
    if (!this.enabled) return '';

    const markName = `${type}_${name}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = performance.now();

    // Usar Performance API del navegador
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${markName}_start`);
    }

    const metric: PerformanceMetric = {
      name,
      type,
      startTime,
      metadata,
    };

    // Guardar referencia para poder finalizarla
    (window as any).__perfMetrics = (window as any).__perfMetrics || {};
    (window as any).__perfMetrics[markName] = metric;

    return markName;
  }

  /**
   * Finalizar medición
   */
  end(markName: string, status: 'success' | 'error' | 'warning' = 'success', metadata?: Record<string, any>) {
    if (!this.enabled || !markName) return;

    const metric = (window as any).__perfMetrics?.[markName];
    if (!metric) {
      console.warn(`[Performance] No se encontró métrica: ${markName}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = status;
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    // Usar Performance API para medir
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${markName}_end`);
      try {
        performance.measure(markName, `${markName}_start`, `${markName}_end`);
      } catch (e) {
        // Ignorar errores si las marcas no existen
      }
    }

    // Agregar a la lista de métricas
    this.addMetric(metric);

    // Limpiar referencia
    delete (window as any).__perfMetrics[markName];

    // Log si es lento
    if (this.logToConsole && duration > this.logSlowThreshold) {
      const emoji = status === 'error' ? '❌' : status === 'warning' ? '⚠️' : '🐌';
      console.warn(
        `${emoji} [Performance] ${metric.type.toUpperCase()} lento: "${metric.name}" - ${duration.toFixed(2)}ms`,
        metadata || ''
      );
    }

    return duration;
  }

  /**
   * Medir tiempo de ejecución de una función
   */
  async measure<T>(
    name: string,
    type: PerformanceMetric['type'],
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const markName = this.start(name, type, metadata);
    try {
      const result = await fn();
      this.end(markName, 'success');
      return result;
    } catch (error) {
      this.end(markName, 'error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Agregar métrica a la lista
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Limitar tamaño de array
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift(); // Remover la más antigua
    }
  }

  /**
   * Obtener métricas filtradas
   */
  getMetrics(filters?: {
    type?: PerformanceMetric['type'];
    route?: string;
    componentName?: string;
    minDuration?: number;
    maxDuration?: number;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filters?.type) {
      filtered = filtered.filter((m) => m.type === filters.type);
    }
    if (filters?.route) {
      filtered = filtered.filter((m) => m.route === filters.route);
    }
    if (filters?.componentName) {
      filtered = filtered.filter((m) => m.componentName === filters.componentName);
    }
    if (filters?.minDuration) {
      filtered = filtered.filter((m) => m.duration && m.duration >= filters.minDuration!);
    }
    if (filters?.maxDuration) {
      filtered = filtered.filter((m) => m.duration && m.duration <= filters.maxDuration!);
    }

    return filtered;
  }

  /**
   * Detectar módulo basándose en la ruta
   */
  private detectModule(route?: string): string {
    if (!route) return 'Otros';
    if (route.startsWith('/crm')) return 'CRM';
    if (route.startsWith('/admin')) return 'Admin';
    if (route.startsWith('/contratacion') || route.startsWith('/hiring')) return 'Contratación';
    if (route.startsWith('/auth') || route.startsWith('/login')) return 'Autenticación';
    return 'Otros';
  }

  /**
   * Generar análisis por módulos
   */
  getModuleAnalysis() {
    const moduleStats: Record<string, {
      pages: PerformanceMetric[];
      components: PerformanceMetric[];
      apiCalls: PerformanceMetric[];
      totalCount: number;
      averageDuration: number;
      slowestItems: PerformanceMetric[];
    }> = {};

    this.metrics.forEach((metric) => {
      const module = this.detectModule(metric.route);
      if (!moduleStats[module]) {
        moduleStats[module] = {
          pages: [],
          components: [],
          apiCalls: [],
          totalCount: 0,
          averageDuration: 0,
          slowestItems: [],
        };
      }

      if (metric.type === 'page') {
        moduleStats[module].pages.push(metric);
      } else if (metric.type === 'component') {
        moduleStats[module].components.push(metric);
      } else if (metric.type === 'api') {
        moduleStats[module].apiCalls.push(metric);
      }
      moduleStats[module].totalCount++;
    });

    // Calcular promedios y más lentos por módulo
    Object.keys(moduleStats).forEach((module) => {
      const stats = moduleStats[module];
      const allMetrics = [...stats.pages, ...stats.components, ...stats.apiCalls];
      const durations = allMetrics.filter(m => m.duration !== undefined).map(m => m.duration!);
      
      if (durations.length > 0) {
        stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }

      stats.slowestItems = allMetrics
        .filter(m => m.duration !== undefined)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 10);
    });

    return moduleStats;
  }

  /**
   * Análisis por rutas
   */
  getRouteAnalysis() {
    const routeStats: Record<string, {
      count: number;
      averageDuration: number;
      slowest: PerformanceMetric[];
      types: Record<string, number>;
    }> = {};

    this.metrics.forEach((metric) => {
      const route = metric.route || 'unknown';
      if (!routeStats[route]) {
        routeStats[route] = {
          count: 0,
          averageDuration: 0,
          slowest: [],
          types: {},
        };
      }

      routeStats[route].count++;
      routeStats[route].types[metric.type] = (routeStats[route].types[metric.type] || 0) + 1;
      
      if (metric.duration !== undefined) {
        routeStats[route].slowest.push(metric);
      }
    });

    // Calcular promedios y ordenar
    Object.keys(routeStats).forEach((route) => {
      const stats = routeStats[route];
      const durations = stats.slowest.map(m => m.duration!);
      if (durations.length > 0) {
        stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }
      stats.slowest = stats.slowest
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5);
    });

    // Ordenar rutas por promedio de duración (más lentas primero)
    return Object.entries(routeStats)
      .sort(([, a], [, b]) => b.averageDuration - a.averageDuration)
      .reduce((acc, [route, stats]) => {
        acc[route] = stats;
        return acc;
      }, {} as typeof routeStats);
  }

  /**
   * Generar reporte de rendimiento
   */
  getReport(): PerformanceReport {
    const pages = this.metrics.filter((m) => m.type === 'page');
    const components = this.metrics.filter((m) => m.type === 'component');
    const apiCalls = this.metrics.filter((m) => m.type === 'api');

    const calculateAverage = (metrics: PerformanceMetric[]) => {
      if (metrics.length === 0) return 0;
      const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      return total / metrics.length;
    };

    const getSlowest = (metrics: PerformanceMetric[], count = 5) => {
      return [...metrics]
        .filter((m) => m.duration !== undefined)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, count);
    };

    return {
      metrics: [...this.metrics],
      summary: {
        totalPages: pages.length,
        totalComponents: components.length,
        totalApiCalls: apiCalls.length,
        averagePageLoad: calculateAverage(pages),
        averageComponentRender: calculateAverage(components),
        averageApiCall: calculateAverage(apiCalls),
        slowestPages: getSlowest(pages),
        slowestComponents: getSlowest(components),
        slowestApiCalls: getSlowest(apiCalls),
      },
    };
  }

  /**
   * Limpiar métricas
   */
  clear() {
    this.metrics = [];
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Imprimir reporte en consola
   */
  printReport() {
    const report = this.getReport();
    const { summary } = report;

    console.group('📊 Performance Report');
    console.log('📄 Páginas:', summary.totalPages);
    console.log('🧩 Componentes:', summary.totalComponents);
    console.log('🌐 Llamadas API:', summary.totalApiCalls);
    console.log('');
    console.log('⏱️  Promedios:');
    console.log(`  Páginas: ${summary.averagePageLoad.toFixed(2)}ms`);
    console.log(`  Componentes: ${summary.averageComponentRender.toFixed(2)}ms`);
    console.log(`  API: ${summary.averageApiCall.toFixed(2)}ms`);
    console.log('');

    if (summary.slowestPages.length > 0) {
      console.log('🐌 Páginas más lentas:');
      summary.slowestPages.forEach((page) => {
        console.log(`  ${page.name}: ${page.duration?.toFixed(2)}ms`);
      });
    }

    if (summary.slowestComponents.length > 0) {
      console.log('🐌 Componentes más lentos:');
      summary.slowestComponents.forEach((comp) => {
        console.log(`  ${comp.componentName || comp.name}: ${comp.duration?.toFixed(2)}ms`);
      });
    }

    if (summary.slowestApiCalls.length > 0) {
      console.log('🐌 API más lentas:');
      summary.slowestApiCalls.forEach((api) => {
        console.log(`  ${api.apiEndpoint || api.name}: ${api.duration?.toFixed(2)}ms`);
      });
    }

    console.groupEnd();
  }

  /**
   * Exportar métricas como JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }

  /**
   * Medir tiempo de carga de página
   */
  measurePageLoad(route: string) {
    if (!this.enabled) return;

    const markName = this.start(`page_${route}`, 'page', { route });
    (window as any).__perfPageLoad = markName;

    // Medir cuando la página está completamente cargada
    if (document.readyState === 'complete') {
      setTimeout(() => this.end(markName, 'success', { route }), 0);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.end(markName, 'success', { route }), 0);
      });
    }
  }

  /**
   * Finalizar medición de carga de página
   */
  endPageLoad() {
    const markName = (window as any).__perfPageLoad;
    if (markName) {
      this.end(markName, 'success');
      delete (window as any).__perfPageLoad;
    }
  }
}

// Singleton
export const performanceTracingService = new PerformanceTracingService();

// Exponer en window para debugging
if (typeof window !== 'undefined') {
  (window as any).__performanceTracing = performanceTracingService;
  (window as any).__perfReport = () => performanceTracingService.printReport();
  (window as any).__perfClear = () => performanceTracingService.clear();
}

