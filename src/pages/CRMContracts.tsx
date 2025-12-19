// CRM Contracts - Lista de contratos para el módulo CRM
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { contractsService } from '@/services/contractsService';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type {
  Contract,
  ContractFilters,
  ContractStatus,
  KYCStatus,
  ClientGrade,
} from '@/types/contracts';
import {
  CONTRACT_STATUS_COLORS,
  KYC_STATUS_COLORS,
  GRADE_COLORS,
} from '@/types/contracts';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { formatContractStatus, formatKYCStatus } from '@/utils/statusTranslations';

export function CRMContracts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ContractFilters>({
    status: 'all',
    kyc_status: 'all',
    grade: 'all',
    payment_type: 'all',
    search: '',
    skip: 0,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [filters]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const response = await contractsService.getContracts(filters);
      setContracts(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Error cargando contratos:', error);
      setContracts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, skip: 0 }));
  };

  const handleFilterChange = (key: keyof ContractFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await contractsService.exportContracts(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contratos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando contratos:', error);
      alert('Error al exportar contratos. Por favor intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && filters.skip > 0) {
      setFilters((prev) => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
    } else if (direction === 'next' && filters.skip + filters.limit < total) {
      setFilters((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
    }
  };

  const currentPage = Math.floor(filters.skip / filters.limit) + 1;
  const totalPages = Math.ceil(total / filters.limit);

  // Estadísticas rápidas
  const stats = {
    total,
    pending: contracts.filter((c) => c.status === 'pending').length,
    paid: contracts.filter((c) => c.status === 'paid').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm text-gray-600 mt-1">Gestiona todos los contratos de contratación</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || total === 0}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pagados</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completados</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Buscar por código, nombre, email..."
                className="pl-9 sm:pl-10 text-sm sm:text-base"
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              {showFilters && (
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="completed">Completado</option>
                    <option value="expired">Expirado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <select
                    value={filters.kyc_status || 'all'}
                    onChange={(e) => handleFilterChange('kyc_status', e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos los KYC</option>
                    <option value="pending">KYC Pendiente</option>
                    <option value="verified">KYC Verificado</option>
                    <option value="failed">KYC Fallido</option>
                  </select>
                  <select
                    value={filters.grade || 'all'}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos los grados</option>
                    <option value="A">Grado A</option>
                    <option value="B+">Grado B+</option>
                    <option value="B-">Grado B-</option>
                    <option value="C">Grado C</option>
                    <option value="T">Grado T</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contratos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={FileText}
              title="No se encontraron contratos"
              description="No hay contratos que coincidan con los filtros seleccionados."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/contracts/${contract.hiring_code}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                          {contract.hiring_code}
                        </h3>
                        <Badge
                          className={CONTRACT_STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-800'}
                        >
                          {formatContractStatus(contract.status)}
                        </Badge>
                        {contract.kyc_status && (
                          <Badge
                            className={KYC_STATUS_COLORS[contract.kyc_status] || 'bg-gray-100 text-gray-800'}
                          >
                            KYC: {formatKYCStatus(contract.kyc_status)}
                          </Badge>
                        )}
                        {contract.grade && (
                          <Badge className={GRADE_COLORS[contract.grade] || 'bg-gray-100 text-gray-800'}>
                            {contract.grade}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="truncate">{contract.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{contract.service_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(contract.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 w-full sm:w-auto">
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-green-600">
                          {formatCurrency(contract.amount / 100, contract.currency)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/contracts/${contract.hiring_code}`);
                        }}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    Mostrando {filters.skip + 1} - {Math.min(filters.skip + filters.limit, total)} de {total} contratos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('prev')}
                      disabled={filters.skip === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('next')}
                      disabled={filters.skip + filters.limit >= total}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

