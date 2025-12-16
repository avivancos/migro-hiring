// Admin Contracts - Lista de contratos con UI mobile-first
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
  Plus,
  Calendar,
  Mail,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type {
  Contract,
  ContractFilters,
  ContractStatus,
  KYCStatus,
  ClientGrade,
  PaymentType,
} from '@/types/contracts';
import {
  CONTRACT_STATUS_COLORS,
  KYC_STATUS_COLORS,
  GRADE_COLORS,
} from '@/types/contracts';
import { formatDate, formatCurrency } from '@/utils/formatters';

export function AdminContracts() {
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
    setFilters((prev) => {
      const newSkip = direction === 'next' 
        ? (prev.skip || 0) + (prev.limit || 20)
        : Math.max(0, (prev.skip || 0) - (prev.limit || 20));
      return { ...prev, skip: newSkip };
    });
  };

  const getStatusBadge = (status: ContractStatus) => {
    const colors = CONTRACT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const labels: Record<ContractStatus, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      completed: 'Completado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return (
      <Badge className={colors}>
        {labels[status]}
      </Badge>
    );
  };

  const getKYCStatusBadge = (status: KYCStatus) => {
    const colors = KYC_STATUS_COLORS[status || null] || 'bg-gray-100 text-gray-800';
    const labels: Record<string, string> = {
      null: 'No iniciado',
      pending: 'Pendiente',
      verified: 'Verificado',
      failed: 'Fallido',
    };
    return (
      <Badge className={colors}>
        {labels[status || 'null']}
      </Badge>
    );
  };

  const getGradeBadge = (grade?: ClientGrade) => {
    if (!grade) return null;
    const colors = GRADE_COLORS[grade] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colors}>
        Grado {grade}
      </Badge>
    );
  };

  const currentPage = Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 20));
  const hasNextPage = (filters.skip || 0) + (filters.limit || 20) < total;
  const hasPrevPage = (filters.skip || 0) > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gestiona todos los contratos de contratación
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting || total === 0}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Download size={16} className="mr-2" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button
            onClick={() => navigate('/admin/contracts/create')}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Contrato
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por código, nombre, email..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Filter size={16} className="mr-2" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>

            {/* Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="completed">Completado</option>
                    <option value="expired">Expirado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* KYC Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KYC
                  </label>
                  <select
                    value={filters.kyc_status || 'all'}
                    onChange={(e) => handleFilterChange('kyc_status', e.target.value === 'all' ? 'all' : e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Todos</option>
                    <option value="null">No iniciado</option>
                    <option value="pending">Pendiente</option>
                    <option value="verified">Verificado</option>
                    <option value="failed">Fallido</option>
                  </select>
                </div>

                {/* Grade Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grado
                  </label>
                  <select
                    value={filters.grade || 'all'}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Todos</option>
                    <option value="A">Grado A</option>
                    <option value="B">Grado B</option>
                    <option value="C">Grado C</option>
                    <option value="T">Testing</option>
                  </select>
                </div>

                {/* Payment Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago
                  </label>
                  <select
                    value={filters.payment_type || 'all'}
                    onChange={(e) => handleFilterChange('payment_type', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Todos</option>
                    <option value="one_time">Pago único</option>
                    <option value="subscription">Suscripción</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {contracts.filter((c) => c.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {contracts.filter((c) => c.status === 'paid').length}
            </div>
            <div className="text-sm text-gray-600">Pagados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter((c) => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completados</div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Cargando contratos..." />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay contratos"
          description={
            filters.search || filters.status !== 'all'
              ? 'No se encontraron contratos con los filtros aplicados.'
              : 'Aún no hay contratos creados. Crea el primero para comenzar.'
          }
          action={
            !filters.search && filters.status === 'all' ? (
              <Button onClick={() => navigate('/admin/contracts/create')}>
                <Plus size={16} className="mr-2" />
                Crear Contrato
              </Button>
            ) : (
              <Button onClick={() => setFilters({ ...filters, search: '', status: 'all', skip: 0 })}>
                Limpiar Filtros
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="block sm:hidden space-y-4">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/admin/contracts/${contract.hiring_code}`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{contract.client_name}</h3>
                        <p className="text-sm text-gray-600">{contract.client_email}</p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText size={14} />
                      <span className="font-mono">{contract.hiring_code}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign size={14} />
                        <span>{formatCurrency(contract.amount, contract.currency)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={14} />
                        <span>{formatDate(contract.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getKYCStatusBadge(contract.kyc_status)}
                      {getGradeBadge(contract.grade)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KYC
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/admin/contracts/${contract.hiring_code}`)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contract.client_name}</div>
                            <div className="text-sm text-gray-500">{contract.client_email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900">{contract.hiring_code}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{contract.service_name}</div>
                          {contract.grade && (
                            <div className="mt-1">{getGradeBadge(contract.grade)}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(contract.amount, contract.currency)}
                          </div>
                          {contract.payment_type === 'subscription' && (
                            <div className="text-xs text-gray-500">Suscripción</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(contract.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getKYCStatusBadge(contract.kyc_status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contract.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/contracts/${contract.hiring_code}`);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > (filters.limit || 20) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {filters.skip + 1} - {Math.min(filters.skip + (filters.limit || 20), total)} de {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange('prev')}
                  disabled={!hasPrevPage}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Anterior
                </Button>
                <div className="text-sm text-gray-600 px-4">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  onClick={() => handlePageChange('next')}
                  disabled={!hasNextPage}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}



