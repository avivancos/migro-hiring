// Admin Opportunities - Tabla de oportunidades con asignación bulk de agentes
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { opportunityApi } from '@/services/opportunityApi';
import { adminService } from '@/services/adminService';
import { getValidAttemptsCount } from '@/utils/opportunity';
import {
  Briefcase,
  Search,
  UserCheck,
  UserX,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LeadOpportunity, OpportunityFilters } from '@/types/opportunity';
import type { User } from '@/types/user';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AssignRandomOpportunities } from '@/components/admin/AssignRandomOpportunities';

type SortField = 'detected_at' | 'opportunity_score' | 'status' | 'assigned_to_id' | 'contact_name';
type SortOrder = 'asc' | 'desc';

export function AdminOpportunities() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<LeadOpportunity[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgentId, setBulkAgentId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  
  // Búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<string>('unassigned'); // Por defecto mostrar solo no asignadas
  const [filterAssignedToAgent, setFilterAssignedToAgent] = useState<string>(''); // Filtrar por agente específico
  
  // Filtros rápidos
  const [filterSinSituacion, setFilterSinSituacion] = useState(false);
  const [filterIntentosDisponibles, setFilterIntentosDisponibles] = useState<number | null>(null);
  const [filterConInfoAsignada, setFilterConInfoAsignada] = useState<boolean | null>(null);
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('detected_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Cargar agentes del sistema (no usuarios CRM)
  useEffect(() => {
    const loadAgents = async () => {
      const allAgents: User[] = [];
      
      // Intentar cargar usuarios filtrando por cada role que necesitamos
      // Esto puede ayudar a evitar el usuario problemático si el backend filtra antes de validar
      const rolesToLoad = ['agent', 'lawyer', 'admin'];
      
      for (const role of rolesToLoad) {
        try {
          console.log(`🔄 [AdminOpportunities] Intentando cargar usuarios con role: ${role}`);
          const response = await adminService.getAllUsers({ 
            is_active: true,
            role: role,
            limit: 1000
          });
          
          if (response.items && response.items.length > 0) {
            allAgents.push(...response.items);
            console.log(`✅ [AdminOpportunities] Cargados ${response.items.length} usuarios con role ${role}`);
          }
        } catch (error: any) {
          console.warn(`⚠️ [AdminOpportunities] Error cargando usuarios con role ${role}:`, error?.response?.status, error?.response?.data?.detail);
          
          // Si falla con un role específico, continuar con los demás
          if (error?.response?.status === 500 && 
              error?.response?.data?.detail?.includes('phone_number')) {
            console.error(`⚠️ [AdminOpportunities] Error del backend al cargar role ${role}: Hay usuarios con phone_number vacío. ` +
              'El backend necesita permitir valores null/vacíos para phone_number. ' +
              'Ver docs/BACKEND_USERS_PHONE_NUMBER_VALIDATION_ERROR.md');
          }
        }
      }
      
      // Si no pudimos cargar ningún usuario, intentar sin filtrar por role como último recurso
      if (allAgents.length === 0) {
        try {
          console.log('🔄 [AdminOpportunities] Intentando cargar todos los usuarios sin filtrar por role');
          const response = await adminService.getAllUsers({ 
            is_active: true,
            limit: 1000
          });
          
          // Filtrar localmente por roles
          const agentsFiltered = response.items.filter((u: User) => 
            u.role === 'agent' || u.role === 'lawyer' || u.role === 'admin'
          );
          
          allAgents.push(...agentsFiltered);
        } catch (error: any) {
          console.error('❌ [AdminOpportunities] Error cargando usuarios sin filtrar:', error);
          
          if (error?.response?.status === 500 && 
              error?.response?.data?.detail?.includes('phone_number')) {
            console.error('⚠️ [AdminOpportunities] Error del backend: Hay usuarios con phone_number vacío. ' +
              'El backend necesita permitir valores null/vacíos para phone_number. ' +
              'Ver docs/BACKEND_USERS_PHONE_NUMBER_VALIDATION_ERROR.md');
          }
        }
      }
      
      // Eliminar duplicados por ID
      const uniqueAgents = Array.from(
        new Map(allAgents.map(agent => [agent.id, agent])).values()
      );
      
      console.log('👥 [AdminOpportunities] Usuarios finales cargados:', {
        total: uniqueAgents.length,
        usuarios: uniqueAgents.map(u => ({ id: u.id, email: u.email, role: u.role, full_name: u.full_name }))
      });
      
      setAgents(uniqueAgents);
      
      if (uniqueAgents.length === 0) {
        console.warn('⚠️ [AdminOpportunities] No se pudieron cargar agentes/abogados. El backend tiene un error de validación con phone_number vacío.');
      }
    };
    
    loadAgents();
  }, []);
  
  // Cargar oportunidades
  useEffect(() => {
    loadOpportunities();
  }, [pagination.page, pagination.limit, filterStatus, filterAssigned, filterAssignedToAgent, searchQuery, sortField, sortOrder, filterSinSituacion, filterIntentosDisponibles, filterConInfoAsignada]);
  
  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const filters: OpportunityFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      if (filterStatus !== 'all') {
        filters.status = filterStatus as LeadOpportunity['status'];
      }
      
      // Si hay un agente específico seleccionado, usar ese filtro
      if (filterAssignedToAgent) {
        filters.assigned_to = filterAssignedToAgent;
      }
      
      // Para el filtro "unassigned" o "assigned", aumentar significativamente el límite
      // porque el filtro se aplica localmente después de recibir los datos
      // Si solo pedimos 20, solo podremos filtrar de esas 20
      // También aumentar el límite cuando hay búsqueda activa para obtener más resultados del backend
      const needsLargeLimit = (filterAssigned !== 'all' && !filterAssignedToAgent && 
                                (filterAssigned === 'unassigned' || filterAssigned === 'assigned')) ||
                               (searchQuery.trim().length > 0);
      
      if (needsLargeLimit) {
        // Aumentar límite para obtener más oportunidades y poder filtrar correctamente
        // Esto asegura que podamos mostrar suficientes oportunidades después del filtrado local
        filters.limit = 1000; // Solicitar muchos datos para poder filtrar localmente
        filters.page = 1; // Siempre empezar desde la página 1 cuando filtramos localmente
      }
      
      const response = await opportunityApi.list(filters);
      
      // Aplicar filtros localmente
      let filteredOpportunities = response.opportunities;
      
      // Si hay búsqueda activa, aplicar filtro local también (como respaldo si el backend no filtra)
      // Esto busca en nombre, email, ciudad del contacto
      if (searchQuery.trim().length > 0) {
        const searchLower = searchQuery.trim().toLowerCase();
        filteredOpportunities = filteredOpportunities.filter(opp => {
          const contact = opp.contact;
          if (!contact) return false;
          
          // Buscar en nombre completo
          const fullName = (contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()).toLowerCase();
          if (fullName.includes(searchLower)) return true;
          
          // Buscar en nombre
          if (contact.first_name?.toLowerCase().includes(searchLower)) return true;
          
          // Buscar en apellido
          if (contact.last_name?.toLowerCase().includes(searchLower)) return true;
          
          // Buscar en email
          if (contact.email?.toLowerCase().includes(searchLower)) return true;
          
          // Buscar en ciudad
          if (contact.city?.toLowerCase().includes(searchLower)) return true;
          
          return false;
        });
      }
      
      // Inicializar realTotal con el total del backend por defecto
      let realTotal = response.total;
      
      // Filtro por asignación (solo si no hay agente específico seleccionado)
      if (!filterAssignedToAgent) {
        if (filterAssigned === 'assigned') {
          filteredOpportunities = filteredOpportunities.filter(opp => opp.assigned_to_id);
        } else if (filterAssigned === 'unassigned') {
          filteredOpportunities = filteredOpportunities.filter(opp => !opp.assigned_to_id);
        }
      }
      // Si hay un agente específico, el filtro ya se aplicó en el backend
      
      // Filtro: Sin situación conocida (no tiene grading_situacion)
      if (filterSinSituacion) {
        filteredOpportunities = filteredOpportunities.filter(opp => {
          const contact = opp.contact;
          return !contact?.grading_situacion;
        });
      }
      
      // Filtro: Intentos disponibles (1-5)
      if (filterIntentosDisponibles !== null) {
        filteredOpportunities = filteredOpportunities.filter(opp => {
          const usedAttempts = getValidAttemptsCount(opp.first_call_attempts);
          const availableAttempts = 5 - usedAttempts;
          return availableAttempts === filterIntentosDisponibles;
        });
      }
      
      // Filtro: Con info asignada (tiene assigned_to_id)
      if (filterConInfoAsignada !== null) {
        if (filterConInfoAsignada) {
          filteredOpportunities = filteredOpportunities.filter(opp => opp.assigned_to_id);
        } else {
          filteredOpportunities = filteredOpportunities.filter(opp => !opp.assigned_to_id);
        }
      }
      
      // Ordenar localmente si es necesario (aunque el backend debería hacerlo)
      filteredOpportunities.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'detected_at':
            comparison = new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime();
            break;
          case 'opportunity_score':
            comparison = a.opportunity_score - b.opportunity_score;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'assigned_to_id':
            comparison = (a.assigned_to_id || '').localeCompare(b.assigned_to_id || '');
            break;
          case 'contact_name':
            const nameA = a.contact?.name || a.contact?.first_name || '';
            const nameB = b.contact?.name || b.contact?.first_name || '';
            comparison = nameA.localeCompare(nameB);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // Calcular el total real después de aplicar TODOS los filtros locales
      // Cuando usamos límite aumentado (búsqueda o filtros locales), necesitamos recalcular el total
      const needsLocalPagination = (filterAssigned !== 'all' && !filterAssignedToAgent && 
                                     (filterAssigned === 'unassigned' || filterAssigned === 'assigned')) ||
                                    (searchQuery.trim().length > 0);
      
      if (needsLocalPagination) {
        // Para filtros locales o búsqueda, el total real es el número de resultados filtrados
        // después de aplicar todos los filtros
        realTotal = filteredOpportunities.length;
      }
      
      // Aplicar paginación local después de filtrar (si usamos límite aumentado)
      if (needsLocalPagination) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        filteredOpportunities = filteredOpportunities.slice(startIndex, endIndex);
      }
      
      setOpportunities(filteredOpportunities);
      setTotal(realTotal);
    } catch (error) {
      console.error('Error cargando oportunidades:', error);
      setOpportunities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-green-600" />
      : <ArrowDown className="w-4 h-4 text-green-600" />;
  };
  
  // Selección de oportunidades
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.size === opportunities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(opportunities.map(opp => opp.id)));
    }
  };
  
  // Asignación bulk
  const handleBulkAssign = async () => {
    if (!bulkAgentId) {
      alert('Por favor selecciona un agente');
      return;
    }
    
    if (selectedIds.size === 0) {
      alert('Por favor selecciona al menos una oportunidad');
      return;
    }
    
    const selectedCount = selectedIds.size;
    if (!confirm(`¿Estás seguro de asignar ${selectedCount} oportunidad(es) al agente seleccionado?`)) {
      return;
    }
    
    setAssigning(true);
    try {
      // Usar bulkAssign que internamente usa múltiples llamadas individuales
      // hasta que el backend implemente el endpoint batch
      const result = await opportunityApi.bulkAssign({
        opportunity_ids: Array.from(selectedIds),
        assigned_to_id: bulkAgentId,
      });
      
      // Guardar el contador antes de limpiar
      const successCount = result.assigned_count;
      
      // Limpiar selección y recargar
      setSelectedIds(new Set());
      setBulkAgentId('');
      await loadOpportunities();
      
      if (result.failed_count > 0) {
        alert(`${successCount} oportunidad(es) asignada(s) correctamente. ${result.failed_count} fallaron.`);
      } else {
        alert(`${successCount} oportunidad(es) asignada(s) correctamente`);
      }
    } catch (error) {
      console.error('Error asignando oportunidades:', error);
      alert('Error al asignar oportunidades. Por favor intenta de nuevo.');
    } finally {
      setAssigning(false);
    }
  };

  // Desasignación bulk
  const handleBulkUnassign = async () => {
    if (selectedIds.size === 0) {
      alert('Por favor selecciona al menos una oportunidad');
      return;
    }
    
    const selectedCount = selectedIds.size;
    if (!confirm(`¿Estás seguro de desasignar ${selectedCount} oportunidad(es)? Esto removerá el agente asignado.`)) {
      return;
    }
    
    setUnassigning(true);
    try {
      const result = await opportunityApi.bulkUnassign({
        opportunity_ids: Array.from(selectedIds),
      });
      
      // Guardar el contador antes de limpiar
      const successCount = result.unassigned_count;
      
      // Limpiar selección y recargar
      setSelectedIds(new Set());
      await loadOpportunities();
      
      if (result.failed_count > 0) {
        alert(`${successCount} oportunidad(es) desasignada(s) correctamente. ${result.failed_count} fallaron.`);
      } else {
        alert(`${successCount} oportunidad(es) desasignada(s) correctamente`);
      }
    } catch (error) {
      console.error('Error desasignando oportunidades:', error);
      alert('Error al desasignar oportunidades. Por favor intenta de nuevo.');
    } finally {
      setUnassigning(false);
    }
  };
  
  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterAssigned('unassigned'); // Volver al valor por defecto
    setFilterAssignedToAgent('');
    setFilterSinSituacion(false);
    setFilterIntentosDisponibles(null);
    setFilterConInfoAsignada(null);
    setPagination({ page: 1, limit: 20 });
  };
  
  const activeFiltersCount = [
    searchQuery,
    filterStatus !== 'all' ? filterStatus : null,
    filterAssigned !== 'all' ? filterAssigned : null,
    filterAssignedToAgent ? 'agent' : null,
    filterSinSituacion ? 'sin-situacion' : null,
    filterIntentosDisponibles !== null ? `intentos-${filterIntentosDisponibles}` : null,
    filterConInfoAsignada !== null ? (filterConInfoAsignada ? 'con-info' : 'sin-info') : null,
  ].filter(Boolean).length;
  
  const hasActiveFilters = activeFiltersCount > 0;
  
  // Calcular valores de paginación
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pagination.limit)) : 1;
  const hasNextPage = pagination.page < totalPages;
  const hasPrevPage = pagination.page > 1;
  
  if (loading && opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  const getStatusBadge = (status: LeadOpportunity['status']) => {
    const variants: Record<string, 'default' | 'success' | 'neutral' | 'destructive'> = {
      pending: 'neutral',
      assigned: 'default',
      contacted: 'default',
      converted: 'success',
      expired: 'neutral',
      lost: 'destructive',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignada',
      contacted: 'Contactada',
      converted: 'Convertida',
      expired: 'Expirada',
      lost: 'Perdida',
    };
    
    return (
      <Badge variant={variants[status] || 'neutral'}>
        {labels[status] || status}
      </Badge>
    );
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 font-semibold';
    if (score >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };
  
  // Helper para obtener el nombre del agente asignado
  const getAssignedToDisplayName = (opportunity: LeadOpportunity): string | null => {
    // Primero: Si viene expandido del backend (assigned_to), usarlo directamente
    if (opportunity.assigned_to) {
      // CRMUser tiene el campo 'name'
      const name = opportunity.assigned_to.name || opportunity.assigned_to.email;
      if (name) return name;
    }
    
    // Segundo: Si no viene expandido pero tenemos assigned_to_id, buscarlo en la lista de agentes del sistema
    // NOTA: Los agentes cargados son del tipo User (sistema), no CRMUser
    // assigned_to_id debería corresponder al ID de un usuario del sistema
    if (opportunity.assigned_to_id && agents.length > 0) {
      const agent = agents.find(a => {
        // Comparación estricta de strings, normalizando espacios
        const agentId = String(a.id || '').trim();
        const assignedId = String(opportunity.assigned_to_id || '').trim();
        return agentId === assignedId;
      });
      
      if (agent) {
        return agent.full_name || agent.email || 'Usuario sin nombre';
      }
      
      // Si no se encuentra, log para debugging
      console.warn(`⚠️ [AdminOpportunities] Agente no encontrado para assigned_to_id: "${opportunity.assigned_to_id}"`, {
        opportunityId: opportunity.id,
        totalAgents: agents.length,
        availableIds: agents.slice(0, 3).map(a => a.id),
      });
    }
    
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Oportunidades</h2>
          <p className="text-gray-600 mt-1">Administra y asigna oportunidades a agentes</p>
        </div>
      </div>
      
      {/* Asignación Rápida de 50 Oportunidades Aleatorias */}
      <AssignRandomOpportunities
        agents={agents}
        onAssignComplete={() => {
          loadOpportunities();
        }}
      />

      {/* Asignación Manual de Oportunidades Seleccionadas - CASO DE USO 2 */}
      {selectedIds.size > 0 && (
        <Card className="bg-green-50 border-green-300">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Asignar Oportunidades Seleccionadas Manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Asignar {selectedIds.size} oportunidad(es) seleccionada(s) a:
                </Label>
                <select
                  value={bulkAgentId}
                  onChange={(e) => setBulkAgentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={assigning || unassigning}
                >
                  <option value="">Seleccionar agente...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.full_name ? `${agent.full_name} (${agent.email})` : agent.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Selecciona las oportunidades usando los checkboxes y asígnalas al agente seleccionado
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkAssign}
                  disabled={!bulkAgentId || assigning || unassigning}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 whitespace-nowrap"
                >
                  {assigning ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Asignar Seleccionadas</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBulkUnassign}
                  disabled={assigning || unassigning}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 flex items-center gap-2 whitespace-nowrap"
                >
                  {unassigning ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Desasignando...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Desasignar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por contacto, email, teléfono..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
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
                  <Filter className="w-4 h-4" />
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
                    <X className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Filtro de Asignación - Visible siempre */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Ver Oportunidades</Label>
              <div className="flex flex-col gap-2">
                <select
                  value={filterAssigned}
                  onChange={(e) => {
                    setFilterAssigned(e.target.value);
                    // Si se selecciona "Solo No Asignadas", limpiar el filtro de agente
                    if (e.target.value === 'unassigned') {
                      setFilterAssignedToAgent('');
                    }
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="unassigned">Solo No Asignadas</option>
                  <option value="assigned">Solo Asignadas</option>
                  <option value="all">Todas</option>
                </select>
                
                {/* Select de agente específico - Solo visible cuando no es "Solo No Asignadas" */}
                {filterAssigned !== 'unassigned' && (
                  <select
                    value={filterAssignedToAgent}
                    onChange={(e) => {
                      setFilterAssignedToAgent(e.target.value);
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Todos los agentes</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name ? `${agent.full_name} (${agent.email})` : agent.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Filtros Rápidos - Tags */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Filtros Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                {/* Tag: Sin situación conocida */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterSinSituacion(!filterSinSituacion);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterSinSituacion
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Sin situación conocida
                </button>
                
                {/* Tags: Intentos disponibles (1-5) */}
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setFilterIntentosDisponibles(
                        filterIntentosDisponibles === num ? null : num
                      );
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filterIntentosDisponibles === num
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {num} intento{num !== 1 ? 's' : ''} disponible{num !== 1 ? 's' : ''}
                  </button>
                ))}
                
                {/* Tag: Con info asignada */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterConInfoAsignada(
                      filterConInfoAsignada === true ? null : true
                    );
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterConInfoAsignada === true
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Con info asignada
                </button>
                
                {/* Tag: Sin info asignada */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterConInfoAsignada(
                      filterConInfoAsignada === false ? null : false
                    );
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterConInfoAsignada === false
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Sin info asignada
                </button>
              </div>
            </div>
            
            {/* Panel de Filtros Colapsable */}
            {showFilters && (
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendiente</option>
                      <option value="assigned">Asignada</option>
                      <option value="contacted">Contactada</option>
                      <option value="converted">Convertida</option>
                      <option value="expired">Expirada</option>
                      <option value="lost">Perdida</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Asignación</Label>
                    <select
                      value={filterAssigned}
                      onChange={(e) => {
                        setFilterAssigned(e.target.value);
                        // Si se selecciona "Sin asignar", limpiar el filtro de agente
                        if (e.target.value === 'unassigned') {
                          setFilterAssignedToAgent('');
                        }
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                    >
                      <option value="all">Todas</option>
                      <option value="assigned">Asignadas</option>
                      <option value="unassigned">Sin asignar</option>
                    </select>
                    {filterAssigned !== 'unassigned' && (
                      <select
                        value={filterAssignedToAgent}
                        onChange={(e) => {
                          setFilterAssignedToAgent(e.target.value);
                          setPagination({ ...pagination, page: 1 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                      >
                        <option value="">Todos los agentes</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.full_name ? `${agent.full_name} (${agent.email})` : agent.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Oportunidades ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No se encontraron oportunidades</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === opportunities.length && opportunities.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('contact_name')}
                      >
                        <div className="flex items-center gap-2">
                          Contacto
                          <SortIcon field="contact_name" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('opportunity_score')}
                      >
                        <div className="flex items-center gap-2">
                          Score
                          <SortIcon field="opportunity_score" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Estado
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('assigned_to_id')}
                      >
                        <div className="flex items-center gap-2">
                          Asignado a
                          <SortIcon field="assigned_to_id" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('detected_at')}
                      >
                        <div className="flex items-center gap-2">
                          Fecha Detección
                          <SortIcon field="detected_at" />
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opportunity) => {
                      const contact = opportunity.contact;
                      const contactName = contact?.name || contact?.first_name || contact?.email || 'Sin contacto';
                      const isSelected = selectedIds.has(opportunity.id);
                      
                      return (
                        <tr key={opportunity.id} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(opportunity.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{contactName}</p>
                              {contact?.email && (
                                <p className="text-sm text-gray-500">{contact.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={getScoreColor(opportunity.opportunity_score)}>
                              {opportunity.opportunity_score}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(opportunity.status)}
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const assignedName = getAssignedToDisplayName(opportunity);
                              return assignedName ? (
                                <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1.5 w-fit">
                                  <UserCheck size={12} />
                                  <span>{assignedName}</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">
                                  Sin asignar
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(opportunity.detected_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
                              >
                                Ver
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {opportunities.map((opportunity) => {
                  const contact = opportunity.contact;
                  const contactName = contact?.name || contact?.first_name || contact?.email || 'Sin contacto';
                  const isSelected = selectedIds.has(opportunity.id);
                  
                  return (
                    <Card key={opportunity.id} className={isSelected ? 'bg-blue-50 border-blue-200' : ''}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{contactName}</p>
                              {contact?.email && (
                                <p className="text-sm text-gray-500">{contact.email}</p>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(opportunity.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary mt-1"
                            />
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge>
                              Score: <span className={getScoreColor(opportunity.opportunity_score)}>{opportunity.opportunity_score}</span>
                            </Badge>
                            {getStatusBadge(opportunity.status)}
                          </div>
                          
                          <div className="text-sm">
                            <div className="text-gray-600">
                              <strong>Asignado a:</strong>{' '}
                              {(() => {
                                const assignedName = getAssignedToDisplayName(opportunity);
                                return assignedName ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-300 inline-flex items-center gap-1.5 ml-1">
                                    <UserCheck size={12} />
                                    <span>{assignedName}</span>
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300 ml-1">
                                    Sin asignar
                                  </Badge>
                                );
                              })()}
                            </div>
                            <p className="text-gray-500 mt-1">
                              Detectada: {new Date(opportunity.detected_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Paginación */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, total)} de {total}
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
                      setPagination({ page: 1, limit: newLimit });
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
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!hasPrevPage}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600 px-2 min-w-[120px] text-center">
                  Página {pagination.page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!hasNextPage}
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

