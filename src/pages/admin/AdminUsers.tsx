// Admin Users - Lista de usuarios con búsqueda avanzada y filtrado
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { ArrowDownIcon, ArrowDownTrayIcon, ArrowUpIcon, ArrowsUpDownIcon, DocumentTextIcon, EnvelopeIcon, FunnelIcon, MagnifyingGlassIcon, PencilIcon, ShieldCheckIcon, TrashIcon, UserIcon, UserPlusIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types/user';

type SortField = 'name' | 'email' | 'phone_number' | 'role' | 'is_active' | 'last_login' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Búsqueda - desde URL o estado
  const searchFromUrl = searchParams.get('search');
  const decodedSearch = searchFromUrl ? decodeURIComponent(searchFromUrl.replace(/\+/g, ' ')) : '';
  
  // Estado para el input (inmediato) y para la búsqueda (debounced)
  const [inputValue, setInputValue] = useState(decodedSearch);
  const [searchQuery, setSearchQuery] = useState(decodedSearch);
  
  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        setSearchQuery(inputValue);
        setPagination(prev => ({ ...prev, skip: 0 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, searchQuery]);
  
  // Filtros básicos
  const [filterRole, setFilterRole] = useState<string>(searchParams.get('role') || 'all');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('is_active') || 'all');
  const [filterVerified, setFilterVerified] = useState<string>(searchParams.get('is_verified') || 'all');
  
  // Filtros adicionales
  const [nationality, setNationality] = useState(searchParams.get('nationality') || '');
  const [profession, setProfession] = useState(searchParams.get('profession') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [isLawyer, setIsLawyer] = useState<string>(searchParams.get('is_lawyer') || '');
  const [lawyerSpecialty, setLawyerSpecialty] = useState(searchParams.get('lawyer_specialty') || '');
  
  // Filtros de fechas (convertir ISO 8601 a YYYY-MM-DD para inputs)
  const parseDateFromUrl = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr.split('T')[0]; // Si ya está en formato YYYY-MM-DD
    }
  };
  
  const [lastLoginFrom, setLastLoginFrom] = useState(parseDateFromUrl(searchParams.get('last_login_from')));
  const [lastLoginTo, setLastLoginTo] = useState(parseDateFromUrl(searchParams.get('last_login_to')));
  const [createdFrom, setCreatedFrom] = useState(parseDateFromUrl(searchParams.get('created_from')));
  const [createdTo, setCreatedTo] = useState(parseDateFromUrl(searchParams.get('created_to')));
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sort_by') as SortField) || 'created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sort_order') as SortOrder) || 'desc');
  
  // Paginación
  const [pagination, setPagination] = useState({
    skip: parseInt(searchParams.get('skip') || '0'),
    limit: parseInt(searchParams.get('limit') || '20'),
  });

  // Actualizar URL cuando cambian los filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterRole !== 'all') params.set('role', filterRole);
    if (filterStatus !== 'all') params.set('is_active', filterStatus);
    if (filterVerified !== 'all') params.set('is_verified', filterVerified);
    if (nationality) params.set('nationality', nationality);
    if (profession) params.set('profession', profession);
    if (city) params.set('city', city);
    if (isLawyer) params.set('is_lawyer', isLawyer);
    if (lawyerSpecialty) params.set('lawyer_specialty', lawyerSpecialty);
    if (lastLoginFrom) params.set('last_login_from', lastLoginFrom);
    if (lastLoginTo) params.set('last_login_to', lastLoginTo);
    if (createdFrom) params.set('created_from', createdFrom);
    if (createdTo) params.set('created_to', createdTo);
    if (sortField) params.set('sort_by', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    params.set('skip', pagination.skip.toString());
    params.set('limit', pagination.limit.toString());
    
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterRole, filterStatus, filterVerified, nationality, profession, city, isLawyer, lawyerSpecialty, lastLoginFrom, lastLoginTo, createdFrom, createdTo, sortField, sortOrder, pagination.skip, pagination.limit]);

  // Cargar usuarios cuando cambian los filtros o paginación
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.skip, pagination.limit, filterRole, filterStatus, filterVerified, searchQuery, nationality, profession, city, isLawyer, lawyerSpecialty, lastLoginFrom, lastLoginTo, createdFrom, createdTo, sortField, sortOrder]);
  
  // Inicializar desde URL al cargar
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      const decoded = decodeURIComponent(searchFromUrl.replace(/\+/g, ' '));
      if (decoded !== searchQuery) {
        setSearchQuery(decoded);
        setInputValue(decoded);
      }
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: pagination.skip,
        limit: pagination.limit,
      };

      // Búsqueda
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      // Filtros básicos
      if (filterRole !== 'all') {
        params.role = filterRole;
      }
      if (filterStatus !== 'all') {
        params.is_active = filterStatus === 'active';
      }
      if (filterVerified !== 'all') {
        params.is_verified = filterVerified === 'verified';
      }
      
      // Filtros adicionales
      if (nationality.trim()) {
        params.nationality = nationality.trim();
      }
      if (profession.trim()) {
        params.profession = profession.trim();
      }
      if (city.trim()) {
        params.city = city.trim();
      }
      if (isLawyer !== '') {
        params.is_lawyer = isLawyer === 'true';
      }
      if (lawyerSpecialty.trim()) {
        params.lawyer_specialty = lawyerSpecialty.trim();
      }
      
      // Filtros de fechas (convertir YYYY-MM-DD a ISO 8601)
      if (lastLoginFrom) {
        params.last_login_from = `${lastLoginFrom}T00:00:00Z`;
      }
      if (lastLoginTo) {
        params.last_login_to = `${lastLoginTo}T23:59:59Z`;
      }
      if (createdFrom) {
        params.created_from = `${createdFrom}T00:00:00Z`;
      }
      if (createdTo) {
        params.created_to = `${createdTo}T23:59:59Z`;
      }
      
      // Ordenamiento
      if (sortField) {
        params.sort_by = sortField;
        params.sort_order = sortOrder;
      }

      const response = await adminService.getAllUsers(params);
      console.log('📊 [AdminUsers] Respuesta del servicio:', {
        itemsCount: response.items.length,
        total: response.total,
        tipoTotal: typeof response.total,
        esNumero: typeof response.total === 'number',
        skip: response.skip,
        limit: response.limit,
        paramsEnviados: params,
      });
      
      // Validar que total sea un número válido
      const totalValue = typeof response.total === 'number' && !isNaN(response.total) 
        ? response.total 
        : response.items.length; // Fallback: usar longitud de items si total no es válido
      
      setUsers(response.items);
      setTotal(totalValue);
      
      if (typeof response.total !== 'number' || isNaN(response.total)) {
        console.warn('⚠️ [AdminUsers] Total no es un número válido, usando fallback:', {
          totalRecibido: response.total,
          totalUsado: totalValue,
        });
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Los filtros ahora se aplican en el backend, pero mantenemos el filtrado local
  // para casos donde el backend no soporte todos los filtros
  const filteredUsers = users;

  // Calcular valores de paginación
  const currentPage = total > 0 ? Math.floor(pagination.skip / pagination.limit) + 1 : 1;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pagination.limit)) : 1;
  
  // Calcular si hay página siguiente/anterior
  // Siguiente: si skip + limit es menor que total, hay más páginas
  // Anterior: si skip es mayor que 0, hay página anterior
  const hasNextPage = total > 0 && (pagination.skip + pagination.limit) < total;
  const hasPrevPage = pagination.skip > 0;
  
  // Debug: mostrar valores de paginación
  const currentEndIndex = pagination.skip + pagination.limit;
  console.log('🔢 [AdminUsers] Estado de paginación:', {
    total,
    skip: pagination.skip,
    limit: pagination.limit,
    currentEndIndex,
    hasNextPage,
    hasPrevPage,
    currentPage,
    totalPages,
    calculo: `${currentEndIndex} < ${total} = ${currentEndIndex < total}`,
    itemsActuales: users.length,
    botonSiguienteDisabled: !hasNextPage,
  });
  
  // Contar filtros activos
  const activeFiltersCount = [
    searchQuery,
    filterRole !== 'all' ? filterRole : null,
    filterStatus !== 'all' ? filterStatus : null,
    filterVerified !== 'all' ? filterVerified : null,
    nationality,
    profession,
    city,
    isLawyer,
    lawyerSpecialty,
    lastLoginFrom,
    lastLoginTo,
    createdFrom,
    createdTo,
  ].filter(Boolean).length;
  
  const hasActiveFilters = activeFiltersCount > 0;
  
  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchQuery('');
    setInputValue('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterVerified('all');
    setNationality('');
    setProfession('');
    setCity('');
    setIsLawyer('');
    setLawyerSpecialty('');
    setLastLoginFrom('');
    setLastLoginTo('');
    setCreatedFrom('');
    setCreatedTo('');
    setSortField('created_at');
    setSortOrder('desc');
    setPagination({ skip: 0, limit: 20 });
  };
  
  // Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 text-green-600" />
      : <ArrowDownIcon className="w-4 h-4 text-green-600" />;
  };
  
  // Obtener nacionalidades únicas para el filtro
  const uniqueNationalities = Array.from(new Set(users.map(u => u.nationality).filter(Boolean))).sort();

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (filterRole !== 'all') filters.role = filterRole;
      if (filterStatus !== 'all') filters.is_active = filterStatus === 'active';
      if (filterVerified !== 'all') filters.is_verified = filterVerified === 'verified';
      if (nationality) filters.nationality = nationality;
      if (profession) filters.profession = profession;
      if (city) filters.city = city;
      if (isLawyer) filters.is_lawyer = isLawyer === 'true';
      if (lawyerSpecialty) filters.lawyer_specialty = lawyerSpecialty;

      const data = await adminService.exportUsers({
        format,
        ...filters,
        limit: 1000,
      });

      if (format === 'csv') {
        // Descargar CSV
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Descargar JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      alert(`Usuarios exportados correctamente en formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exportando usuarios:', error);
      alert('Error al exportar usuarios');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-gray-600 mt-1">Administra usuarios del sistema</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon width={18} height={18} />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('json')}
              variant="outline"
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <DocumentTextIcon width={18} height={18} />
              <span className="hidden sm:inline">Exportar JSON</span>
              <span className="sm:hidden">JSON</span>
            </Button>
            <Button
              onClick={() => navigate('/admin/users/create')}
              className="flex items-center gap-2"
            >
              <UserPlusIcon width={18} height={18} />
              <span className="hidden sm:inline">Nuevo Usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar por nombre, email, teléfono, nacionalidad..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Filtros</span>
                    {hasActiveFilters && (
                      <span className="ml-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Panel de Filtros Colapsable */}
              {showFilters && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filtros Básicos */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Rol</Label>
                      <select
                        value={filterRole}
                        onChange={(e) => {
                          setFilterRole(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">Todos</option>
                        <option value="admin">Admin</option>
                        <option value="lawyer">Abogado</option>
                        <option value="agent">Agente</option>
                        <option value="user">Usuario</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Verificación</Label>
                      <select
                        value={filterVerified}
                        onChange={(e) => {
                          setFilterVerified(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">Todos</option>
                        <option value="verified">Verificados</option>
                        <option value="unverified">No verificados</option>
                      </select>
                    </div>

                    {/* Filtros Adicionales */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Nacionalidad</Label>
                      <select
                        value={nationality}
                        onChange={(e) => {
                          setNationality(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Todas</option>
                        {uniqueNationalities.map(nat => (
                          <option key={nat} value={nat || ''}>{nat || ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Profesión</Label>
                      <Input
                        placeholder="Buscar profesión..."
                        value={profession}
                        onChange={(e) => {
                          setProfession(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Ciudad</Label>
                      <Input
                        placeholder="Buscar ciudad..."
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Es Abogado</Label>
                      <select
                        value={isLawyer}
                        onChange={(e) => {
                          setIsLawyer(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Especialidad Abogado</Label>
                      <Input
                        placeholder="Buscar especialidad..."
                        value={lawyerSpecialty}
                        onChange={(e) => {
                          setLawyerSpecialty(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    {/* Filtros de Fechas */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Último Login Desde</Label>
                      <Input
                        type="date"
                        value={lastLoginFrom}
                        onChange={(e) => {
                          setLastLoginFrom(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Último Login Hasta</Label>
                      <Input
                        type="date"
                        value={lastLoginTo}
                        onChange={(e) => {
                          setLastLoginTo(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Creado Desde</Label>
                      <Input
                        type="date"
                        value={createdFrom}
                        onChange={(e) => {
                          setCreatedFrom(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Creado Hasta</Label>
                      <Input
                        type="date"
                        value={createdTo}
                        onChange={(e) => {
                          setCreatedTo(e.target.value);
                          setPagination({ ...pagination, skip: 0 });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuarios ({total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 && !loading ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No se encontraron usuarios</p>
                <Button
                  onClick={() => navigate('/admin/users/create')}
                  variant="outline"
                  size="sm"
                >
                  Crear primer usuario
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Usuario
                            <SortIcon field="name" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <SortIcon field="email" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center gap-2">
                            Rol
                            <SortIcon field="role" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('is_active')}
                        >
                          <div className="flex items-center gap-2">
                            Estado
                            <SortIcon field="is_active" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('last_login')}
                        >
                          <div className="flex items-center gap-2">
                            Último Login
                            <SortIcon field="last_login" />
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Fecha Creación
                            <SortIcon field="created_at" />
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <EnvelopeIcon width={12} height={12} />
                              {user.email}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={user.role === 'admin' || user.is_superuser ? 'default' : 'neutral'}
                                className="flex items-center gap-1 w-fit"
                              >
                                {user.is_superuser ? (
                                  <ShieldCheckIcon width={12} height={12} />
                                ) : null}
                                {user.role || 'user'}
                              </Badge>
                              {user.is_verified && (
                                <Badge variant="success" className="w-fit text-xs">
                                  Verificado
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={user.is_active ? 'success' : 'neutral'}
                              className="flex items-center gap-1 w-fit"
                            >
                              {user.is_active ? (
                                <UserIcon width={12} height={12} />
                              ) : (
                                <UserIcon width={12} height={12} />
                              )}
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                              >
                                <PencilIcon width={16} height={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon width={16} height={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <EnvelopeIcon width={12} height={12} />
                              {user.email}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={user.role === 'admin' || user.is_superuser ? 'default' : 'neutral'}
                              className="flex items-center gap-1"
                            >
                              {user.is_superuser ? (
                                <ShieldCheckIcon width={12} height={12} />
                              ) : null}
                              {user.role || 'user'}
                            </Badge>
                            <Badge
                              variant={user.is_active ? 'success' : 'neutral'}
                              className="flex items-center gap-1"
                            >
                              {user.is_active ? (
                                <UserIcon width={12} height={12} />
                              ) : (
                                <UserIcon width={12} height={12} />
                              )}
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {user.is_verified && (
                              <Badge variant="success" className="text-xs">
                                Verificado
                              </Badge>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                              >
                                <PencilIcon width={16} height={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon width={16} height={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Paginación */}
            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, total)} de {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="items-per-page" className="text-sm text-gray-600">
                      Por página:
                    </label>
                    <select
                      id="items-per-page"
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination({ skip: 0, limit: newLimit });
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                    disabled={pagination.skip === 0}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600 px-2 min-w-[120px] text-center">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSkip = pagination.skip + pagination.limit;
                      console.log('🔄 [AdminUsers] Navegando a siguiente página:', {
                        skipActual: pagination.skip,
                        limit: pagination.limit,
                        newSkip,
                        total,
                      });
                      setPagination({ ...pagination, skip: newSkip });
                    }}
                    disabled={(() => {
                      // Calcular si hay más páginas
                      const suma = pagination.skip + pagination.limit;
                      const isDisabled = total === 0 || suma >= total;
                      
                      // Solo loggear si está deshabilitado para no saturar la consola
                      if (isDisabled) {
                        console.log('🔍 [AdminUsers] Botón Siguiente DESHABILITADO:', {
                          skip: pagination.skip,
                          limit: pagination.limit,
                          suma,
                          total,
                          razon: total === 0 ? 'total es 0' : `${suma} >= ${total}`,
                        });
                      }
                      
                      return isDisabled;
                    })()}
                    title={pagination.skip + pagination.limit >= total ? `No hay más páginas. Total: ${total}, Mostrando hasta: ${pagination.skip + pagination.limit}` : `Ir a página ${currentPage + 1}`}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

