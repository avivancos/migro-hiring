// CRM Dashboard - Dashboard completo basado en Kommo con datos mock

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { crmService } from '@/services/crmService';
import type { KommoLead, PipelineStatus } from '@/types/crm';
import {
  Users,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Building2,
  Search,
  Filter,
  Plus,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { CRMHeader } from '@/components/CRM/CRMHeader';
import { useAuth } from '@/providers/AuthProvider';

export function CRMDashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [stages, setStages] = useState<PipelineStatus[]>([]);
  const [totalContactsCount, setTotalContactsCount] = useState<number>(0);

  // Solo cargar datos si está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('✅ Sesión válida, cargando datos del dashboard...');
      loadDashboardData();
    }
  }, [isAuthenticated, isLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo desde el backend
      // Usar contactos directamente ya que los leads están unificados con contactos
      const [allContacts, pipelinesData, totalCount] = await Promise.all([
        crmService.getAllContacts().catch(() => []), // Cargar todos los contactos (los leads ahora son contactos)
        crmService.getPipelines().catch(() => []), // Si pipelines no está implementado, usar array vacío
        crmService.getContactsCount().catch(() => 0), // Obtener el conteo real del backend
      ]);

      // Los contactos ahora incluyen todos los campos de leads (service_type, status, etc.)
      // Usar contactos directamente como "leads" (son lo mismo ahora)
      setLeads(allContacts as any);
      setTotalContactsCount(totalCount);

      // Obtener stages del pipeline principal
      if (pipelinesData.length > 0) {
        const mainPipeline = pipelinesData.find(p => p.is_main) || pipelinesData[0];
        try {
          const stagesData = await crmService.getPipelineStages(mainPipeline.id);
          setStages(stagesData);
        } catch (err) {
          console.error('Error loading stages:', err);
          // Si no hay stages, dejar array vacío
          setStages([]);
        }
      } else {
        // Si no hay pipelines, dejar stages vacío
        setStages([]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // Mostrar error al usuario en lugar de usar datos mock
      setError('Error al cargar datos del dashboard. Por favor, verifica que el backend esté disponible.');
      // Inicializar con datos vacíos
      setLeads([]);
      setStages([]);
    } finally {
      setLoading(false);
    }
  };

  // handleLogout ahora está en CRMHeader
  // La autenticación se maneja con ProtectedRoute en App.tsx

  // Si está cargando datos del dashboard, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del CRM...</p>
        </div>
      </div>
    );
  }

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = selectedStage === null || lead.status === selectedStage || lead.status_id === selectedStage;
    
    return matchesSearch && matchesStage;
  });

  // Leads asignados al usuario actual para efectuar llamadas
  const myLeadsForCalls = leads
    .filter(lead => lead.responsible_user_id === user?.id)
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, 10); // Solo los últimos 10

  // Agrupar leads por stage (usando status en lugar de status_id)
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(lead => 
      lead.status === stage.name?.toLowerCase() || 
      lead.status_id === stage.id ||
      String(lead.status_id) === String(stage.id)
    );
    return acc;
  }, {} as Record<string | number, KommoLead[]>);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const cleanContactName = (name: string | undefined): string => {
    if (!name) return '';
    // Eliminar el prefijo "Lead - " si existe
    return name.replace(/^Lead\s*-\s*/i, '').trim();
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-3 h-3" />;
      case 'high':
        return <Activity className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Error al cargar datos</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadDashboardData();
            }}
            className="w-full"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <CRMHeader />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        {/* Mis Contactos para Llamadas */}
        <Card className="mb-4 sm:mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-blue-900">
                    Mis Contactos para Llamadas
                  </CardTitle>
                  <span className="text-[10px] xs:text-xs sm:text-sm font-normal text-blue-700 bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {myLeadsForCalls.length} asignados
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/crm/contacts')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 md:h-10"
              >
                <span className="sm:inline">Ver todos mis contactos</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <p className="text-[11px] xs:text-xs sm:text-sm text-blue-700 mb-3 sm:mb-4">
              Últimos 10 contactos asignados a ti para efectuar llamadas. El sistema distribuye automáticamente los contactos entre los agentes.
            </p>
            {myLeadsForCalls.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {myLeadsForCalls.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/crm/contacts/${lead.id}`)}
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate">{lead.name}</h3>
                        {lead.priority && lead.priority !== 'medium' && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                              lead.priority
                            )}`}
                          >
                            {lead.priority}
                          </span>
                        )}
                        {lead.status && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                            {lead.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-[10px] xs:text-xs sm:text-sm text-gray-600">
                        {lead.contact && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {lead.contact.first_name} {lead.contact.last_name}
                            </span>
                          </div>
                        )}
                        {lead.contact?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{lead.contact.phone}</span>
                          </div>
                        )}
                        {lead.service_type && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{lead.service_type}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{formatDate(lead.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {lead.price > 0 && (
                        <div className="text-right">
                          <p className="text-sm sm:text-base md:text-lg font-bold text-green-600">
                            {formatCurrency(lead.price)}
                          </p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/crm/contacts/${lead.id}?action=call`);
                        }}
                      >
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="sm:inline">Llamar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500">
                  No hay contactos asignados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Kanban */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Pipeline de Ventas</h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-gray-600">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{totalContactsCount > 0 ? totalContactsCount : filteredLeads.length} contactos</span>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-3 sm:pb-4 -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
            {stages.map((stage) => {
              const stageLeads = leadsByStage[stage.id] || [];
              const stageTotal = stageLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

              return (
                <div key={stage.id} className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-80">
                  <Card className="h-full">
                    <CardHeader
                      className="pb-3"
                      style={{ borderTopColor: stage.color, borderTopWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {stage.name}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({stageLeads.length})
                          </span>
                        </CardTitle>
                      </div>
                      {stageTotal > 0 && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {formatCurrency(stageTotal)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-green-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                              {lead.name}
                            </h4>
                            {lead.priority && lead.priority !== 'medium' && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getPriorityColor(
                                  lead.priority
                                )}`}
                              >
                                {getPriorityIcon(lead.priority)}
                                {lead.priority}
                              </span>
                            )}
                          </div>

                          {lead.contact && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <Users className="w-3 h-3" />
                              <span>
                                {lead.contact.first_name} {lead.contact.last_name}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5 text-xs text-gray-600">
                            {lead.price && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(lead.price)}
                                </span>
                              </div>
                            )}

                            {lead.service_type && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                <span>{lead.service_type}</span>
                              </div>
                            )}

                            {lead.contact?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{lead.contact.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(lead.created_at)}</span>
                            </div>
                          </div>

                          {lead.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {lead.description}
                            </p>
                          )}
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p>No hay contactos en esta etapa</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4 md:pt-6">
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Buscar contactos por nombre, servicio..."
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm md:text-base h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <Button
                    variant={selectedStage === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStage(null)}
                    className="flex-shrink-0 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="sm:inline">Todos</span>
                  </Button>
                  {stages.slice(0, 3).map((stage) => (
                    <Button
                      key={stage.id}
                      variant={selectedStage === stage.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStage(stage.id)}
                      style={
                        selectedStage === stage.id
                          ? { borderTopColor: stage.color, borderTopWidth: '3px' }
                          : {}
                      }
                      className="flex-shrink-0 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                    >
                      {stage.name}
                    </Button>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Navegando a nuevo contacto desde dashboard...');
                    navigate('/crm/contacts/new');
                  }}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="sm:inline">Nuevo Contacto</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contactos Recientes - Lista */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <CardTitle className="text-lg sm:text-xl font-bold">Contactos Recientes</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/crm/contacts')} className="w-full sm:w-auto">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLeads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{cleanContactName(lead.name)}</h3>
                      {lead.priority && lead.priority !== 'medium' && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                            lead.priority
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      )}
                      {(lead.status_id === '5' || lead.status === 'won') && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      {lead.contact && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {lead.contact.first_name} {lead.contact.last_name}
                          </span>
                        </div>
                      )}
                      {lead.service_type && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{lead.service_type}</span>
                        </div>
                      )}
                      {lead.contact?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{lead.contact.phone}</span>
                        </div>
                      )}
                      {lead.contact?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{lead.contact.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron contactos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Urgentes y Expedientes - Al final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-xl font-bold text-red-900">Acciones Urgentes</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/actions')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-4">
                Tareas y acciones que requieren atención inmediata para cerrar ventas y avanzar expedientes
              </p>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/crm/actions?filter=urgent')}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Ver Acciones Urgentes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-xl font-bold text-purple-900">Expedientes Legales</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/expedientes')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-4">
                Gestiona el estado y seguimiento de todos los expedientes legales en proceso
              </p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/crm/expedientes')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Expedientes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

