// CRM Dashboard - Dashboard completo basado en Kommo con datos mock

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePagePerformanceTrace } from '@/hooks/usePerformanceTrace';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { crmService } from '@/services/crmService';
import { contractsService } from '@/services/contractsService';
import type { KommoLead, PipelineStatus, Call, Task, Note } from '@/types/crm';
import type { Contract } from '@/types/contracts';
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
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { formatContractStatus, formatCallStatus, formatLeadStatus, formatPriority } from '@/utils/statusTranslations';
import { opportunityApi } from '@/services/opportunityApi';
import { isAgent } from '@/utils/searchValidation';
import { AgentJournalWidget } from '@/components/agentJournal/AgentJournalWidget';
import { PerformanceDashboardView } from '@/components/agentJournal/PerformanceDashboardView';

export function CRMDashboardPage() {
  // Medir rendimiento de la página
  usePagePerformanceTrace({ pageName: 'CRM Dashboard' });

  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [stages, setStages] = useState<PipelineStatus[]>([]);
  const [totalContactsCount, setTotalContactsCount] = useState<number>(0);
  const [totalContractsCount, setTotalContractsCount] = useState<number>(0);
  const [lastContracts, setLastContracts] = useState<Contract[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekCalls, setWeekCalls] = useState<Record<string, Call[]>>({});
  const [weekTasks, setWeekTasks] = useState<Record<string, Task[]>>({});
  const [myOpportunitiesCount, setMyOpportunitiesCount] = useState<number>(0);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  
  // Determinar si el usuario es agente
  const userIsAgent = user ? isAgent(user.role) : false;
  // const userIsAdmin = user ? isAdminOrSuperuser(user.role, user.is_superuser) : false;

  // Solo cargar datos si está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('✅ Sesión válida, cargando datos del dashboard...');
      loadDashboardData();
    }
  }, [isAuthenticated, isLoading, currentDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calcular inicio y fin de la semana basada en currentDate
      const dateForWeek = new Date(currentDate);
      const startOfWeek = new Date(dateForWeek);
      startOfWeek.setDate(dateForWeek.getDate() - dateForWeek.getDay()); // Domingo
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
      endOfWeek.setHours(23, 59, 59, 999);

      // Cargar datos en paralelo desde el backend
      // Para agentes, cargar solo sus oportunidades asignadas
      const loadPromises: Promise<any>[] = [
        crmService.getPipelines().catch(() => []), // Si pipelines no está implementado, usar array vacío
        // No cargar contratos para agentes
        userIsAgent ? Promise.resolve({ items: [], total: 0 }) : contractsService.getContracts({ limit: 10, skip: 0 }).catch(() => ({ items: [], total: 0 })), // Obtener últimos contratos
        crmService.getCalendarCalls({
          start_date: startOfWeek.toISOString(),
          end_date: endOfWeek.toISOString(),
        }).catch(() => []), // Obtener llamadas de la semana actual
        crmService.getCalendarTasks({
          start_date: startOfWeek.toISOString(),
          end_date: endOfWeek.toISOString(),
        }).catch(() => []), // Obtener tareas de la semana actual
      ];
      
      // Solo cargar contactos y contar si no es agente
      if (!userIsAgent) {
        loadPromises.push(
          crmService.getAllContacts().catch(() => []), // Cargar todos los contactos
          crmService.getContactsCount().catch(() => 0) // Obtener el conteo real del backend
        );
      } else {
        // Para agentes, no cargar contactos ni contar
        loadPromises.push(Promise.resolve([]), Promise.resolve(0));
      }
      
      // Cargar oportunidades: todas para admins, solo asignadas para agentes
      if (userIsAgent && user?.id) {
        loadPromises.push(
          opportunityApi.list({ assigned_to: user.id, limit: 1000 }).catch(() => ({ opportunities: [], total: 0 }))
        );
      } else {
        // Para admins, cargar oportunidades recientes (últimas 10)
        loadPromises.push(
          opportunityApi.list({ limit: 10, page: 1 }).catch(() => ({ opportunities: [], total: 0 }))
        );
      }
      
      // Cargar tareas y notas recientes
      loadPromises.push(
        crmService.getTasks({ limit: 10, is_completed: false }).catch(() => ({ items: [] })),
        crmService.getNotes({ limit: 10 }).catch(() => ({ items: [] }))
      );
      
      const [pipelinesData, contractsResponse, weekCallsData, weekTasksData, allContacts, totalCount, opportunitiesResponse, recentTasksResponse, recentNotesResponse] = await Promise.all(loadPromises);

      // Los contactos ahora incluyen todos los campos de leads (service_type, status, etc.)
      // Usar contactos directamente como "leads" (son lo mismo ahora)
      // Para agentes, no establecer contactos ni total
      if (!userIsAgent) {
        setLeads(allContacts as any);
        setTotalContactsCount(totalCount);
      } else {
        setLeads([]);
        setTotalContactsCount(0);
        // Establecer conteo de oportunidades asignadas
        setMyOpportunitiesCount(opportunitiesResponse?.total || 0);
      }
      
      // Guardar oportunidades recientes para mostrar en dashboard (para todos)
      if (opportunitiesResponse?.opportunities) {
        const sorted = opportunitiesResponse.opportunities
          .sort((a: any, b: any) => new Date(b.detected_at || b.created_at).getTime() - new Date(a.detected_at || a.created_at).getTime())
          .slice(0, 5);
        setRecentOpportunities(sorted);
      }
      
      // Guardar tareas y notas recientes
      const sortedRecentTasks = (recentTasksResponse?.items || [])
        .sort((a: Task, b: Task) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentTasks(sortedRecentTasks);
      
      const sortedRecentNotes = (recentNotesResponse?.items || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentNotes(sortedRecentNotes);
      setTotalContractsCount(contractsResponse.total || 0);
      
      // Ordenar contratos por fecha (más recientes primero)
      const sortedContracts = (contractsResponse.items || []).sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setLastContracts(sortedContracts.slice(0, 5)); // Solo los 5 más recientes

      // Agrupar llamadas de la semana por día
      const callsByDate: Record<string, Call[]> = {};
      weekCallsData.forEach((call: Call) => {
        const callDate = new Date(call.started_at || call.created_at);
        const dateKey = callDate.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!callsByDate[dateKey]) {
          callsByDate[dateKey] = [];
        }
        callsByDate[dateKey].push(call);
      });
      setWeekCalls(callsByDate);

      // Agrupar tareas de la semana por día
      const tasksByDate: Record<string, Task[]> = {};
      weekTasksData.forEach((task: Task) => {
        if (task.complete_till) {
          const taskDate = new Date(task.complete_till);
          const dateKey = taskDate.toISOString().split('T')[0]; // YYYY-MM-DD
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
          }
          tasksByDate[dateKey].push(task);
        }
      });
      setWeekTasks(tasksByDate);

      // Obtener stages del pipeline principal
      if (pipelinesData.length > 0) {
        const mainPipeline = pipelinesData.find((p: any) => p.is_main) || pipelinesData[0];
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

  // handleLogout ahora está en el layout
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

  const formatCurrency = (amount: number, currency: string = 'EUR', inCents: boolean = true): string => {
    // Si inCents es true (contratos), dividir entre 100. Si es false (leads), usar directamente
    const amountInUnits = inCents ? amount / 100 : amount;
    // Normalizar moneda: siempre usar EUR para evitar símbolo de dólar
    const normalizedCurrency = currency?.toUpperCase() === 'USD' ? 'EUR' : (currency?.toUpperCase() || 'EUR');
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amountInUnits);
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

  // Funciones para el mini calendario semanal
  const getWeekDays = () => {
    const dateForWeek = new Date(currentDate);
    const startOfWeek = new Date(dateForWeek);
    startOfWeek.setDate(dateForWeek.getDate() - dateForWeek.getDay()); // Domingo
    
    const days: Array<{ date: Date; dayNumber: number; dateKey: string }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      days.push({
        date,
        dayNumber: date.getDate(),
        dateKey,
      });
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  };

  const getCallsForDay = (dateKey: string): Call[] => {
    return weekCalls[dateKey] || [];
  };

  const getTasksForDay = (dateKey: string): Task[] => {
    return weekTasks[dateKey] || [];
  };

  const getCallIcon = (call: Call) => {
    if (call.direction === 'inbound') {
      return call.call_status === 'missed' || call.status === 'missed' ? PhoneMissed : PhoneIncoming;
    }
    return PhoneOutgoing;
  };

  const getCallStatusColor = (call: Call): string => {
    const status = call.call_status || call.status;
    if (status === 'missed') return 'text-red-600';
    if (status === 'no_answer') return 'text-yellow-600';
    if (call.direction === 'inbound') return 'text-green-600';
    return 'text-blue-600';
  };

  // Helper para formatear el título de la llamada en lenguaje natural
  const getCallTitle = (call: Call): string => {
    const callDate = new Date(call.started_at || call.created_at);
    const hour = callDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Obtener nombre del contacto - prioridad: contact_name > phone > fallback
    let contactName = call.contact_name;
    
    if (!contactName) {
      contactName = call.phone || call.phone_number || 'Cliente';
    }
    
    const direction = call.direction === 'inbound' ? 'de' : 'a';
    return `Llamada ${direction} ${contactName} a las ${hour} horas`;
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
    <div className="w-full space-y-4 sm:space-y-6">
        {/* Cards de Estadísticas */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${userIsAgent ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
          {/* Ocultar "Contactos Totales" para agentes */}
          {!userIsAgent && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Contactos Totales</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalContactsCount}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Para agentes, mostrar solo sus oportunidades asignadas */}
          {userIsAgent && (
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Mis Oportunidades</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{myOpportunitiesCount}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ocultar tarjetas de contratos para agentes */}
          {!userIsAgent && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Contratos Totales</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalContractsCount}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Últimos Contratos</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{lastContracts.length}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Contactos Activos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {leads.filter(l => l.status !== 'won' && l.status !== 'lost').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 1. Métricas de Productividad - Solo para agentes */}
        {userIsAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-bold">Métricas de Productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceDashboardView />
            </CardContent>
          </Card>
        )}

        {/* 2. Grid: Calendario y Journal - Solo para agentes */}
        {userIsAgent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Mini Calendario Semanal */}
            <Card>
            <CardHeader className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-bold">Semana Actual</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => navigateWeek('prev')}
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => navigateWeek('next')}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {(() => {
                  const weekDays = getWeekDays();
                  const start = weekDays[0].date;
                  const end = weekDays[6].date;
                  return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                })()}
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                {getWeekDays().map((dayInfo) => {
                  const dayCalls = getCallsForDay(dayInfo.dateKey);
                  const dayTasks = getTasksForDay(dayInfo.dateKey);
                  const today = isToday(dayInfo.date);
                  const totalItems = dayCalls.length + dayTasks.length;
                  
                  return (
                    <div
                      key={dayInfo.dateKey}
                      className={`
                        p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer
                        ${today 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                      onClick={() => navigate('/crm/calendar')}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`
                            text-xs sm:text-sm font-semibold
                            ${today ? 'text-primary' : 'text-gray-700'}
                          `}>
                            {getDayName(dayInfo.date)}
                          </span>
                          <span className={`
                            text-sm sm:text-base font-bold
                            ${today ? 'text-primary' : 'text-gray-900'}
                          `}>
                            {dayInfo.dayNumber}
                          </span>
                        </div>
                        {totalItems > 0 && (
                          <span className="text-xs font-medium text-gray-600">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </div>
                      {totalItems > 0 ? (
                        <div className="space-y-1.5 mt-2">
                          {/* Llamadas en lenguaje natural */}
                          {dayCalls.slice(0, 3).map((call) => {
                            const CallIcon = getCallIcon(call);
                            const iconColor = getCallStatusColor(call);
                            const callTitle = getCallTitle(call);
                            const callStatus = formatCallStatus(call.call_status || call.status);
                            return (
                              <div
                                key={`call-${call.id}`}
                                className={`
                                  p-2 rounded-md bg-white border text-xs
                                  ${call.direction === 'inbound' ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'}
                                  hover:shadow-sm transition-all cursor-pointer
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (call.entity_id && call.entity_type) {
                                    const entityType = call.entity_type === 'contacts' ? 'contacts' : 'leads';
                                    navigate(`/crm/${entityType}/${call.entity_id}`);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <CallIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {callTitle}
                                    </p>
                                    <p className="text-gray-500 text-[10px] mt-0.5">
                                      {callStatus}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Tareas */}
                          {dayTasks.slice(0, 3 - dayCalls.length).map((task) => {
                            const taskIcon = task.task_type === 'call' ? Phone : 
                                            task.task_type === 'meeting' ? Calendar :
                                            task.task_type === 'email' ? Mail : FileText;
                            const taskTime = task.complete_till 
                              ? new Date(task.complete_till).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                              : '';
                            return (
                              <div
                                key={`task-${task.id}`}
                                className="p-2 rounded-md bg-white border border-purple-200 bg-purple-50/50 hover:shadow-sm transition-all cursor-pointer text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.entity_id && task.entity_type) {
                                    const entityType = task.entity_type === 'contacts' ? 'contacts' : 'leads';
                                    navigate(`/crm/${entityType}/${task.entity_id}`);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  {taskIcon === Phone && <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                                  {taskIcon === Calendar && <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                                  {taskIcon === Mail && <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                                  {taskIcon === FileText && <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {task.text}
                                    </p>
                                    {taskTime && (
                                      <p className="text-gray-500 text-[10px] mt-0.5">
                                        {taskTime}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Indicador de más items */}
                          {totalItems > 3 && (
                            <div className="p-2 rounded-md bg-gray-100 border border-gray-200 text-center">
                              <span className="text-xs font-medium text-gray-600">
                                +{totalItems - 3} {totalItems - 3 === 1 ? 'evento más' : 'eventos más'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">Sin eventos</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs sm:text-sm"
                onClick={() => navigate('/crm/calendar')}
              >
                Ver Calendario Completo
              </Button>
            </CardContent>
          </Card>

          {/* Agent Journal Widget */}
          <AgentJournalWidget />
        </div>
        )}

        {/* Últimos Contratos - Solo para no agentes */}
        {!userIsAgent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Mini Calendario Semanal */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-bold">Semana Actual</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => navigateWeek('prev')}
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => navigateWeek('next')}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {(() => {
                    const weekDays = getWeekDays();
                    const start = weekDays[0].date;
                    const end = weekDays[6].date;
                    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  })()}
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
                  {getWeekDays().map((dayInfo) => {
                    const dayCalls = getCallsForDay(dayInfo.dateKey);
                    const dayTasks = getTasksForDay(dayInfo.dateKey);
                    const today = isToday(dayInfo.date);
                    const totalItems = dayCalls.length + dayTasks.length;
                    
                    return (
                      <div
                        key={dayInfo.dateKey}
                        className={`
                          p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer
                          ${today 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => navigate('/crm/calendar')}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`
                              text-xs sm:text-sm font-semibold
                              ${today ? 'text-primary' : 'text-gray-700'}
                            `}>
                              {getDayName(dayInfo.date)}
                            </span>
                            <span className={`
                              text-sm sm:text-base font-bold
                              ${today ? 'text-primary' : 'text-gray-900'}
                            `}>
                              {dayInfo.dayNumber}
                            </span>
                          </div>
                          {totalItems > 0 && (
                            <span className="text-xs font-medium text-gray-600">
                              {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </div>
                        {totalItems > 0 ? (
                          <div className="space-y-1.5 mt-2">
                            {dayCalls.slice(0, 2).map((call) => {
                              const CallIcon = getCallIcon(call);
                              const iconColor = getCallStatusColor(call);
                              const callTitle = getCallTitle(call);
                              return (
                                <div
                                  key={`call-${call.id}`}
                                  className={`
                                    p-2 rounded-md bg-white border text-xs
                                    ${call.direction === 'inbound' ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'}
                                  `}
                                >
                                  <div className="flex items-start gap-2">
                                    <CallIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">
                                        {callTitle}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {totalItems > 2 && (
                              <div className="p-2 rounded-md bg-gray-100 border border-gray-200 text-center">
                                <span className="text-xs font-medium text-gray-600">
                                  +{totalItems - 2} más
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">Sin eventos</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs sm:text-sm"
                  onClick={() => navigate('/crm/calendar')}
                >
                  Ver Calendario Completo
                </Button>
              </CardContent>
            </Card>

            {/* Últimos Contratos */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Últimos Contratos</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/crm/contracts')}
                    className="text-xs sm:text-sm"
                  >
                    Ver todos
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {lastContracts.length > 0 ? (
                  <div className="space-y-3">
                    {lastContracts.map((contract) => {
                      const statusColors: Record<string, string> = {
                        pending: 'bg-yellow-100 text-yellow-700',
                        paid: 'bg-green-100 text-green-700',
                        completed: 'bg-blue-100 text-blue-700',
                        expired: 'bg-red-100 text-red-700',
                        cancelled: 'bg-gray-100 text-gray-700',
                      };
                      return (
                        <div
                          key={contract.id}
                          className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/contracts/${contract.hiring_code}`)}
                        >
                          <div className="p-2 rounded-full bg-white text-purple-600 flex-shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-sm sm:text-base text-gray-900">
                                Contrato {contract.hiring_code} - {contract.client_name}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[contract.status] || 'bg-gray-100 text-gray-700'}`}>
                                {formatContractStatus(contract.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                              <span className="text-gray-500">{contract.service_name}</span>
                              <span>•</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(contract.amount, contract.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Creado: {formatDate(contract.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No hay contratos recientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. Oportunidades Recientes */}
        {recentOpportunities.length > 0 && (
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Oportunidades Recientes</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/crm/opportunities')}
                    className="text-xs sm:text-sm"
                  >
                    Ver todas
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3">
                  {recentOpportunities.map((opp: any) => {
                    const contactName = opp.contact?.name || 
                      (opp.contact?.first_name && opp.contact?.last_name 
                        ? `${opp.contact.first_name} ${opp.contact.last_name}` 
                        : 'Sin nombre');
                    return (
                      <div
                        key={opp.id}
                        className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                      >
                        <div className="p-2 rounded-full bg-white text-blue-600 flex-shrink-0">
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-sm sm:text-base text-gray-900">
                              {contactName}
                            </p>
                            {opp.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                opp.priority === 'high' ? 'bg-red-100 text-red-700' :
                                opp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {opp.priority === 'high' ? 'Alta' : opp.priority === 'medium' ? 'Media' : 'Baja'}
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Score: {opp.opportunity_score}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                            {opp.contact?.email && (
                              <>
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="truncate">{opp.contact.email}</span>
                              </>
                            )}
                            {opp.contact?.mobile && (
                              <>
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                                <span>{opp.contact.mobile}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Detectada: {formatDate(opp.detected_at || opp.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        {/* 4. Tareas y Notas Recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tareas Recientes */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Tareas Recientes</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/tasks')}
                  className="text-xs sm:text-sm"
                >
                  Ver todas
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => {
                    const taskIcon = task.task_type === 'call' ? Phone : 
                                    task.task_type === 'meeting' ? Calendar :
                                    task.task_type === 'email' ? Mail : FileText;
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          if (task.entity_id && task.entity_type) {
                            navigate(`/crm/${task.entity_type}/${task.entity_id}`);
                          } else {
                            navigate(`/crm/tasks/${task.id}`);
                          }
                        }}
                      >
                        <div className="p-2 rounded-full bg-white text-purple-600 flex-shrink-0">
                          {taskIcon === Phone && <Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {taskIcon === Calendar && <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {taskIcon === Mail && <Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {taskIcon === FileText && <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2">
                              {task.text}
                            </p>
                            {task.is_completed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                Pendiente
                              </span>
                            )}
                          </div>
                          {task.complete_till && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Vence: {formatDate(task.complete_till)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No hay tareas recientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas Recientes */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Notas Recientes</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/notes')}
                  className="text-xs sm:text-sm"
                >
                  Ver todas
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note: Note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        if (note.entity_id && note.entity_type) {
                          navigate(`/crm/${note.entity_type}/${note.entity_id}`);
                        }
                      }}
                    >
                      <div className="p-2 rounded-full bg-white text-blue-600 flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                          {note.text || 'Sin contenido'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Creada: {formatDate(note.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No hay notas recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                            {formatPriority(lead.priority)}
                          </span>
                        )}
                        {lead.status && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                            {formatLeadStatus(lead.status)}
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
                            {formatCurrency(lead.price, lead.currency || 'EUR', false)}
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
                                  {formatCurrency(lead.price, lead.currency || 'EUR', false)}
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
  );
}

