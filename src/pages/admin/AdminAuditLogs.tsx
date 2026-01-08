// Admin Audit Logs - Logs de auditoría
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auditService } from '@/services/auditService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { AuditLogEntry, AuditLogFilters } from '@/types/audit';
import { format } from 'date-fns';

export function AdminAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({
    skip: 0,
    limit: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await auditService.getAuditLogs({
        ...filters,
        q: searchQuery || undefined,
      });
      setLogs(response.items);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, skip: 0, q: searchQuery || undefined });
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
            alert(`Exportación ${format} en desarrollo`);
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  const getLogLevel = (action: string): 'info' | 'warning' | 'error' => {
    if (action.includes('deleted') || action.includes('failed')) return 'error';
    if (action.includes('changed') || action.includes('updated')) return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Logs de Auditoría</h2>
          <p className="text-gray-600 mt-1">Registro de todas las acciones administrativas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon width={18} height={18} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <MagnifyingGlassIcon width={18} height={18} />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner text="Cargando logs..." />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No hay logs"
              description="No se encontraron registros de auditoría con los filtros aplicados."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Fecha</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Usuario</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Acción</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Entidad</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-600">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="p-3 text-sm text-gray-900">{log.actor_email}</td>
                      <td className="p-3">
                        <StatusBadge
                          status={log.action}
                          variant={getLogLevel(log.action)}
                          showDot
                        />
                      </td>
                      <td className="p-3 text-sm text-gray-600">{log.entity_type}</td>
                      <td className="p-3 text-sm text-gray-500">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {filters.skip! + 1} - {Math.min(filters.skip! + filters.limit!, total)} de {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, skip: Math.max(0, filters.skip! - filters.limit!) })}
                  disabled={filters.skip === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, skip: filters.skip! + filters.limit! })}
                  disabled={filters.skip! + filters.limit! >= total}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

