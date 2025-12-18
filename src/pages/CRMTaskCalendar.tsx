// CRMTaskCalendar - Vista de calendario para tareas y llamadas (mensual/semanal/diaria)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Phone } from 'lucide-react';
import type { Task, Call, KommoContact, KommoLead } from '@/types/crm';
import { crmService } from '@/services/crmService';

type ViewMode = 'month' | 'week' | 'day';

export function CRMTaskCalendar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  // Leer parámetros de URL
  const view = useMemo(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'month' || viewParam === 'week' || viewParam === 'day') {
      return viewParam;
    }
    return 'month';
  }, [searchParams]);

  const currentDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        // Parsear fecha en formato YYYY-MM-DD como fecha local (no UTC)
        // Esto evita problemas de zona horaria
        const [year, month, day] = dateParam.split('-').map(Number);
        if (year && month && day) {
          const parsedDate = new Date(year, month - 1, day);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      } catch (e) {
        console.warn('⚠️ [CRMTaskCalendar] Error parseando fecha de URL:', dateParam, e);
      }
    }
    return new Date();
  }, [searchParams]);

  // Actualizar URL cuando cambien view o currentDate
  // Solo actualizar si los parámetros actuales son diferentes
  useEffect(() => {
    const currentView = searchParams.get('view') || 'month';
    const currentDateParam = searchParams.get('date');
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    // Solo actualizar si hay diferencia
    if (currentView !== view || currentDateParam !== currentDateStr) {
      const params = new URLSearchParams();
      params.set('view', view);
      params.set('date', currentDateStr);
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentDate]);

  useEffect(() => {
    loadData();
  }, [currentDate, view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      console.log('📅 [CRMTaskCalendar] Cargando datos para:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        view,
      });
      
      // Cargar tareas y llamadas en paralelo usando endpoints específicos del calendario
      const [tasksData, callsData] = await Promise.all([
        crmService.getCalendarTasks({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        // Usar el nuevo endpoint específico para calendario que permite filtrar por fechas
        crmService.getCalendarCalls({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }).catch((err) => {
          console.warn('⚠️ [CRMTaskCalendar] Error cargando llamadas del calendario:', err);
          return [];
        }),
      ]);
      
      // Los endpoints /tasks/calendar y /calls/calendar ya filtran por fechas
      // Retornan arrays directos (List[TaskResponse] y List[CallResponse])
      
      console.log('📅 [CRMTaskCalendar] Tareas cargadas:', tasksData.length);
      console.log('📞 [CRMTaskCalendar] Llamadas cargadas:', callsData.length);
      console.log('📅 [CRMTaskCalendar] Rango de fechas:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        view,
      });
      
      // Log detallado de las llamadas para debugging
      if (callsData.length > 0) {
        console.log('📞 [CRMTaskCalendar] Ejemplo de llamadas cargadas:', callsData.slice(0, 3).map(call => ({
          id: call.id,
          direction: call.direction,
          entity_id: call.entity_id,
          entity_type: call.entity_type,
          phone: call.phone || call.phone_number,
        })));
      }
      
      setTasks(tasksData);
      setCalls(callsData);
      
      // Cargar nombres de contactos/leads para todas las llamadas con entity_id
      await loadEntityNames(callsData);
    } catch (err) {
      console.error('❌ [CRMTaskCalendar] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityNames = async (calls: Call[]) => {
    // Obtener IDs únicos de entidades de todas las llamadas (entrantes y salientes)
    const entityIds = new Set<string>();
    calls.forEach(call => {
      if (call.entity_id) {
        entityIds.add(call.entity_id);
      } else {
        console.warn('⚠️ [CRMTaskCalendar] Llamada sin entity_id:', call.id, call.direction);
      }
    });

    if (entityIds.size === 0) {
      console.log('📞 [CRMTaskCalendar] No hay llamadas con entity_id para cargar nombres');
      return;
    }

    console.log(`📞 [CRMTaskCalendar] Cargando nombres para ${entityIds.size} entidades únicas`);

    const names: Record<string, string> = {};
    const loadPromises: Promise<void>[] = [];

    entityIds.forEach(entityId => {
      // Determinar el tipo de entidad basándose en las llamadas
      const call = calls.find(c => c.entity_id === entityId);
      if (!call) return;

      const entityType = call.entity_type === 'leads' || call.entity_type === 'lead' ? 'leads' : 'contacts';
      
      const promise = (entityType === 'contacts' 
        ? crmService.getContact(entityId)
        : crmService.getLead(entityId)
      )
        .then((entity: KommoContact | KommoLead) => {
          const name = entity.name || 
            (('first_name' in entity) ? `${entity.first_name || ''} ${entity.last_name || ''}`.trim() : '') ||
            'Sin nombre';
          names[entityId] = name;
          console.log(`✅ [CRMTaskCalendar] Nombre cargado para ${entityType} ${entityId}:`, name);
        })
        .catch((err) => {
          console.warn(`⚠️ [CRMTaskCalendar] Error cargando ${entityType} ${entityId}:`, err);
          // Si falla la carga, usar el teléfono de la llamada como fallback temporal
          const call = calls.find(c => c.entity_id === entityId);
          if (call?.phone || call?.phone_number) {
            names[entityId] = call.phone || call.phone_number || 'Contacto';
          } else {
            names[entityId] = 'Contacto';
          }
        });
      
      loadPromises.push(promise);
    });

    await Promise.all(loadPromises);
    console.log(`📞 [CRMTaskCalendar] Nombres cargados (${Object.keys(names).length} entidades):`, names);
    setEntityNames(prev => {
      const updated = { ...prev, ...names };
      console.log(`📞 [CRMTaskCalendar] Estado entityNames actualizado. Total: ${Object.keys(updated).length} entidades`);
      return updated;
    });
  };

  const getStartDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else if (view === 'week') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getEndDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0); // Last day of current month
      date.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      date.setDate(date.getDate() + 6);
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    // Actualizar URL (el useEffect se encargará de actualizar el estado)
    const params = new URLSearchParams();
    params.set('view', view);
    params.set('date', newDate.toISOString().split('T')[0]);
    setSearchParams(params, { replace: true });
  };

  const goToToday = () => {
    const today = new Date();
    const params = new URLSearchParams();
    params.set('view', view);
    params.set('date', today.toISOString().split('T')[0]);
    setSearchParams(params, { replace: true });
  };

  const handleViewChange = (newView: ViewMode) => {
    const params = new URLSearchParams();
    params.set('view', newView);
    params.set('date', currentDate.toISOString().split('T')[0]);
    setSearchParams(params, { replace: true });
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.complete_till) return false;
      const taskDate = new Date(task.complete_till).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const getCallsForDate = (date: Date): Call[] => {
    const dateStr = date.toISOString().split('T')[0];
    const filtered = calls.filter(call => {
      // Usar created_at como fecha de referencia (cuando se graba en el sistema)
      const callCreatedAt = call.created_at || call.started_at;
      if (!callCreatedAt) {
        console.warn('⚠️ [CRMTaskCalendar] Llamada sin fecha:', call.id);
        return false;
      }
      try {
        const callDate = new Date(callCreatedAt).toISOString().split('T')[0];
        return callDate === dateStr;
      } catch (err) {
        console.warn('⚠️ [CRMTaskCalendar] Error parseando fecha de llamada:', call.id, callCreatedAt, err);
        return false;
      }
    });
    
    if (filtered.length > 0 && dateStr === new Date().toISOString().split('T')[0]) {
      console.log(`📞 [CRMTaskCalendar] ${filtered.length} llamadas para hoy (${dateStr})`);
    }
    
    return filtered;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIdx) => {
              if (day === null) {
                return <div key={dayIdx} className="p-2 min-h-[100px]"></div>;
              }
              const date = new Date(year, month, day);
              const dayTasks = getTasksForDate(date);
              const dayCalls = getCallsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const totalItems = dayTasks.length + dayCalls.length;
              const maxDisplay = 3;
              
              return (
                <div
                  key={dayIdx}
                  className={`p-2 border rounded min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => {
                    // Al hacer clic en un día, cambiar a vista diaria y mostrar ese día
                    const params = new URLSearchParams();
                    params.set('view', 'day');
                    params.set('date', date.toISOString().split('T')[0]);
                    setSearchParams(params, { replace: true });
                  }}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                    {/* Mostrar tareas primero */}
                    {dayTasks.slice(0, Math.min(maxDisplay, dayTasks.length)).map(task => (
                      <div
                        key={task.id}
                        className="text-xs p-1 bg-green-100 rounded cursor-pointer hover:bg-green-200"
                        onClick={() => navigate(`/crm/tasks/${task.id}`)}
                      >
                        {task.text}
                      </div>
                    ))}
                    {/* Mostrar llamadas */}
                    {dayCalls.slice(0, Math.max(0, maxDisplay - dayTasks.length)).map(call => {
                      // Siempre mostrar el nombre del contacto si está disponible
                      let displayText = 'Contacto';
                      if (call.entity_id && entityNames[call.entity_id]) {
                        displayText = entityNames[call.entity_id];
                      } else if (!call.entity_id) {
                        // Solo si no hay entity_id, mostrar el teléfono como fallback
                        displayText = call.phone || call.phone_number || 'Sin nombre';
                      }
                      return (
                        <div
                          key={call.id}
                          className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 flex items-center gap-1"
                          onClick={() => {
                            if (call.entity_id) {
                              const entityType = call.entity_type === 'leads' || call.entity_type === 'lead' ? 'leads' : 'contacts';
                              navigate(`/crm/${entityType}/${call.entity_id}`);
                            }
                          }}
                        >
                          <Phone className="w-3 h-3" />
                          <span className="truncate">{displayText}</span>
                        </div>
                      );
                    })}
                    {totalItems > maxDisplay && (
                      <div className="text-xs text-gray-500">
                        +{totalItems - maxDisplay} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getStartDate();
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDays.push(date);
    }
    
    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, idx) => {
          const dayTasks = getTasksForDate(date);
          const dayCalls = getCallsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={idx} 
              className={`border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => {
                // Al hacer clic en un día, cambiar a vista diaria y mostrar ese día
                const params = new URLSearchParams();
                params.set('view', 'day');
                params.set('date', date.toISOString().split('T')[0]);
                setSearchParams(params, { replace: true });
              }}
            >
              <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                {/* Tareas */}
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className="text-xs p-2 bg-green-100 rounded cursor-pointer hover:bg-green-200"
                    onClick={() => navigate(`/crm/tasks/${task.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{task.text}</div>
                        {task.complete_till && (
                          <div className="text-gray-600 mt-1">
                            {new Date(task.complete_till).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                      {task.entity_id && task.entity_type && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const entityType = task.entity_type === 'leads' || task.entity_type === 'lead' ? 'leads' : 'contacts';
                            navigate(`/crm/${entityType}/${task.entity_id}`);
                          }}
                          className="ml-2 h-6 text-xs px-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Llamadas */}
                {dayCalls.map(call => {
                  const callDate = new Date(call.created_at || call.started_at);
                  // Siempre mostrar el nombre del contacto si está disponible
                  let displayTitle = 'Contacto';
                  if (call.entity_id && entityNames[call.entity_id]) {
                    displayTitle = entityNames[call.entity_id];
                  } else if (!call.entity_id) {
                    // Solo si no hay entity_id, mostrar el teléfono como fallback
                    displayTitle = call.phone || call.phone_number || 'Sin nombre';
                  }
                  return (
                    <div
                      key={call.id}
                      className="text-xs p-2 bg-blue-100 rounded cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        if (call.entity_id) {
                          const entityType = call.entity_type === 'leads' || call.entity_type === 'lead' ? 'leads' : 'contacts';
                          navigate(`/crm/${entityType}/${call.entity_id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Phone className="w-3 h-3" />
                          <div className="flex-1">
                            <div className="font-semibold truncate">
                              {displayTitle}
                            </div>
                            <div className="text-gray-600 mt-1">
                              {callDate.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const dayCalls = getCallsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    const hasItems = dayTasks.length > 0 || dayCalls.length > 0;
    
    return (
      <div className="space-y-3">
        <div className={`text-lg font-semibold mb-4 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {currentDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        {hasItems ? (
          <div className="space-y-2">
            {/* Tareas */}
            {dayTasks.map(task => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/crm/tasks/${task.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.text}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Tipo: {task.task_type}
                      </p>
                      {task.complete_till && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(task.complete_till).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.is_completed ? 'Completada' : 'Pendiente'}
                      </span>
                      {task.entity_id && task.entity_type && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const entityType = task.entity_type === 'leads' || task.entity_type === 'lead' ? 'leads' : 'contacts';
                            navigate(`/crm/${entityType}/${task.entity_id}`);
                          }}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Contacto
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Llamadas */}
            {dayCalls.map(call => {
              const callDate = new Date(call.created_at || call.started_at);
              // Siempre mostrar el nombre del contacto si está disponible
              let displayTitle = 'Contacto';
              if (call.entity_id && entityNames[call.entity_id]) {
                displayTitle = entityNames[call.entity_id];
              } else if (!call.entity_id) {
                // Solo si no hay entity_id, mostrar el teléfono como fallback
                displayTitle = call.phone || call.phone_number || 'Sin nombre';
              }
              return (
                <Card
                  key={call.id}
                  className="cursor-pointer hover:shadow-md bg-blue-50 border-blue-200"
                  onClick={() => {
                    if (call.entity_id) {
                      const entityType = call.entity_type === 'leads' || call.entity_type === 'lead' ? 'leads' : 'contacts';
                      navigate(`/crm/${entityType}/${call.entity_id}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {displayTitle}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Grabada: {callDate.toLocaleString('es-ES')}
                          </p>
                          {call.phone && (
                            <p className="text-sm text-gray-500 mt-1">
                              Tel: {call.phone}
                            </p>
                          )}
                          {call.duration && (
                            <p className="text-sm text-gray-500 mt-1">
                              Duración: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          call.call_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {call.call_status || 'Desconocido'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No hay tareas ni llamadas para este día
          </div>
        )}
      </div>
    );
  };

  const getViewTitle = (): string => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const start = getStartDate();
      const end = getEndDate();
      return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  return (
    <div className="w-full">
        <div className="space-y-6">
          {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600 mt-1">Gestiona tus tareas y llamadas por fecha</p>
        </div>
        <Button
          onClick={() => navigate('/crm/tasks/new')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus size={20} className="mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigateDate('prev')}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" onClick={() => navigateDate('next')}>
                <ChevronRight size={18} />
              </Button>
              <div className="text-lg font-semibold">{getViewTitle()}</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => handleViewChange('month')}
              >
                Mes
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                onClick={() => handleViewChange('week')}
              >
                Semana
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                onClick={() => handleViewChange('day')}
              >
                Día
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista del Calendario */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">Cargando tareas y llamadas...</div>
          ) : (
            <>
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


