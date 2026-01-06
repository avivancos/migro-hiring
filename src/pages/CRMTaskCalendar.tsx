// CRMTaskCalendar - Vista de calendario para tareas y llamadas (mensual/semanal/diaria)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Phone, User, MessageSquare } from 'lucide-react';
import type { Task, Call, Note, Contact, CRMUser } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { formatCallStatus } from '@/utils/statusTranslations';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'month' | 'week' | 'day';

export function CRMTaskCalendar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
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
    loadUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentDate, view]);

  const loadUsers = async () => {
    try {
      // Cargar todos los usuarios activos y filtrar por roles responsables (lawyers, agents y admins)
      const allUsers = await crmService.getUsers(true);
      const responsibleUsers = allUsers.filter((u) => 
        u.role_name === 'lawyer' || 
        u.role_name === 'agent' || 
        u.role_name === 'admin'
      );
      setUsers(responsibleUsers);
      console.log('👥 [CRMTaskCalendar] Usuarios responsables cargados:', responsibleUsers.length);
      if (responsibleUsers.length > 0) {
        console.log('👥 [CRMTaskCalendar] Ejemplo de usuarios:', responsibleUsers.slice(0, 5).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role_name: u.role_name,
        })));
      }
    } catch (err) {
      console.error('❌ [CRMTaskCalendar] Error loading users:', err);
    }
  };

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
      
      // Cargar tareas, llamadas y notas en paralelo usando endpoints específicos del calendario
      const [tasksData, callsData, notesData] = await Promise.all([
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
        // Cargar notas usando el endpoint normal con filtros de fecha
        crmService.getNotes({
          limit: 1000, // Cargar muchas notas para el rango de fechas
        }).then(response => response.items || []).catch((err) => {
          console.warn('⚠️ [CRMTaskCalendar] Error cargando notas:', err);
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
          contact_id: call.contact_id,
          contact_name: call.contact_name,
          phone: call.phone || call.phone_number,
          responsible_user_id: call.responsible_user_id,
          created_at: call.created_at,
        })));
        
        // Verificar cuántas tienen contact_name
        const withContactName = callsData.filter(c => c.contact_name).length;
        console.log(`📞 [CRMTaskCalendar] Llamadas con contact_name: ${withContactName}/${callsData.length}`);
        
        // Verificar responsables únicos en llamadas
        const responsibleIds = callsData
          .filter(c => c.responsible_user_id)
          .map(c => c.responsible_user_id)
          .filter((id, index, self) => self.indexOf(id) === index);
        console.log('👥 [CRMTaskCalendar] IDs de responsables únicos en llamadas:', responsibleIds);
        console.log('👥 [CRMTaskCalendar] Usuarios disponibles:', users.length);
        if (users.length > 0) {
          console.log('👥 [CRMTaskCalendar] IDs de usuarios disponibles:', users.map(u => u.id).slice(0, 10));
        }
      } else {
        console.warn('⚠️ [CRMTaskCalendar] No se cargaron llamadas. Verificar endpoint y filtros de fecha.');
      }
      
      // Filtrar por creador (solo mostrar a creadores o admins)
      const isAdmin = user?.is_superuser || user?.role === 'admin' || user?.role === 'superuser';
      const currentUserId = user?.id;

      // Filtrar tareas
      const filteredTasks = isAdmin 
        ? tasksData 
        : tasksData.filter(task => task.created_by === currentUserId || task.responsible_user_id === currentUserId);

      // Filtrar llamadas
      const filteredCalls = isAdmin 
        ? callsData 
        : callsData.filter(call => call.responsible_user_id === currentUserId);

      // Filtrar notas
      const filteredNotes = isAdmin 
        ? notesData 
        : notesData.filter(note => note.created_by === currentUserId);

      // Filtrar notas por fecha (usando created_at)
      const notesInRange = filteredNotes.filter(note => {
        if (!note.created_at) return false;
        const noteDate = new Date(note.created_at);
        return noteDate >= startDate && noteDate <= endDate;
      });

      setTasks(filteredTasks);
      setCalls(filteredCalls);
      setNotes(notesInRange);
      
      // Cargar nombres de contactos para todas las llamadas con entity_id que no tienen contact_name
      await loadEntityNames(callsData);
    } catch (err) {
      console.error('❌ [CRMTaskCalendar] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityNames = async (calls: Call[]) => {
    // Primero, mapear contact_name directamente si está disponible (endpoints de calendario)
    const names: Record<string, string> = {};
    calls.forEach(call => {
      if (call.contact_name && call.entity_id) {
        names[call.entity_id] = call.contact_name;
        if (call.contact_id && call.contact_id !== call.entity_id) {
          names[call.contact_id] = call.contact_name;
        }
      }
    });

    // Obtener IDs únicos de entidades que NO tienen contact_name (necesitan cargarse)
    const entityIdsToLoad = new Set<string>();
    calls.forEach(call => {
      if (call.entity_id && !call.contact_name) {
        entityIdsToLoad.add(call.entity_id);
      }
    });

    if (entityIdsToLoad.size === 0) {
      console.log('📞 [CRMTaskCalendar] Todos los nombres ya están disponibles (contact_name)');
      setEntityNames(prev => ({ ...prev, ...names }));
      return;
    }

    console.log(`📞 [CRMTaskCalendar] Cargando nombres para ${entityIdsToLoad.size} entidades que no tienen contact_name`);

    const loadPromises: Promise<void>[] = [];

    entityIdsToLoad.forEach(entityId => {
      const call = calls.find(c => c.entity_id === entityId);
      if (!call) return;

      const contactId = call.contact_id || call.entity_id;
      
      const promise = crmService.getContact(contactId)
        .then((entity: Contact) => {
          const name = entity.name || 
            (('first_name' in entity) ? `${entity.first_name || ''} ${entity.last_name || ''}`.trim() : '') ||
            'Sin nombre';
          names[entityId] = name;
          if (contactId && contactId !== entityId) {
            names[contactId] = name;
          }
          console.log(`✅ [CRMTaskCalendar] Nombre cargado para contact ${entityId}:`, name);
        })
        .catch((err) => {
          console.warn(`⚠️ [CRMTaskCalendar] Error cargando contact ${entityId}:`, err);
          // Usar teléfono como fallback
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


  // Helper para obtener clases CSS según el estado de la llamada
  const getCallStatusClasses = (call: Call): string => {
    const status = call.call_status || call.status;
    if (status === 'no_answer') {
      return 'bg-yellow-100 hover:bg-yellow-200';
    }
    return 'bg-blue-100 hover:bg-blue-200';
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
    
    // Log detallado para debugging
    if (filtered.length > 0) {
      console.log(`📞 [CRMTaskCalendar] ${filtered.length} llamadas para ${dateStr}:`, filtered.map(c => ({
        id: c.id,
        contact_name: c.contact_name || 'Sin nombre',
        phone: c.phone || c.phone_number,
        entity_id: c.entity_id,
      })));
    }
    
    return filtered;
  };

  const getNotesForDate = (date: Date): Note[] => {
    const dateStr = date.toISOString().split('T')[0];
    return notes.filter(note => {
      if (!note.created_at) return false;
      try {
        const noteDate = new Date(note.created_at).toISOString().split('T')[0];
        return noteDate === dateStr;
      } catch (err) {
        console.warn('⚠️ [CRMTaskCalendar] Error parseando fecha de nota:', note.id, note.created_at, err);
        return false;
      }
    });
  };

  // Helper para obtener nombre del responsable
  const getResponsibleName = (userId: string | null | undefined): string => {
    if (!userId) return 'Sin asignar';
    
    // Si no hay usuarios cargados aún, mostrar mensaje temporal
    if (users.length === 0) {
      console.warn(`⚠️ [CRMTaskCalendar] getResponsibleName: Usuarios no cargados aún para ID: "${userId}"`);
      return 'Cargando...';
    }
    
    // Buscar usuario en el array - comparación estricta de strings
    const user = users.find(u => {
      // Comparar IDs como strings, normalizando espacios
      const uId = String(u.id || '').trim();
      const searchId = String(userId || '').trim();
      const matches = uId === searchId;
      if (matches) {
        console.log(`✅ [CRMTaskCalendar] Usuario encontrado:`, {
          id: u.id,
          name: u.name,
          email: u.email,
          searchId: userId,
        });
      }
      return matches;
    });
    
    if (user) {
      // Usar name (que debería contener el nombre completo del usuario del CRM)
      const name = user.name?.trim();
      if (name && name.length > 0) {
        // Log si el nombre contiene "abogado de prueba" para debugging
        if (name.toLowerCase().includes('abogado de prueba') || name.toLowerCase().includes('prueba')) {
          console.warn(`⚠️ [CRMTaskCalendar] Usuario con nombre sospechoso encontrado:`, {
            id: user.id,
            name: user.name,
            email: user.email,
            searchId: userId,
          });
        }
        return name;
      }
      // Fallback a email si no hay name
      const email = user.email?.trim();
      if (email && email.length > 0) {
        return email.split('@')[0]; // Mostrar solo la parte antes del @
      }
      return 'Usuario sin nombre';
    }
    
    // Si no se encuentra, puede ser que los usuarios aún no se hayan cargado
    // o que el ID no coincida exactamente
    console.warn(`⚠️ [CRMTaskCalendar] Usuario no encontrado para ID: "${userId}". Total usuarios cargados: ${users.length}`);
    if (users.length > 0) {
      console.log('📋 [CRMTaskCalendar] IDs de usuarios disponibles:', users.map(u => ({ id: u.id, name: u.name, email: u.email })).slice(0, 10));
      console.log('📋 [CRMTaskCalendar] ID buscado:', userId, 'Tipo:', typeof userId);
      // Verificar si hay algún usuario con nombre "abogado de prueba"
      const pruebaUser = users.find(u => u.name?.toLowerCase().includes('abogado de prueba') || u.name?.toLowerCase().includes('prueba'));
      if (pruebaUser) {
        console.warn(`⚠️ [CRMTaskCalendar] Usuario "abogado de prueba" encontrado en lista:`, {
          id: pruebaUser.id,
          name: pruebaUser.name,
          email: pruebaUser.email,
        });
      }
    }
    
    // Mostrar ID truncado si no se encuentra el usuario
    return userId.substring(0, 8) + '...';
  };

  // Helper para obtener badge del tipo de llamada
  const getCallTypeBadge = (callType: string | undefined) => {
    if (!callType) return null;
    
    const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
      'primera_llamada': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
      'contacto_inicial': { label: 'Contacto Inicial', bg: 'bg-blue-100', text: 'text-blue-800' },
      'seguimiento': { label: 'Seguimiento', bg: 'bg-green-100', text: 'text-green-800' },
      'venta': { label: 'Venta', bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = typeConfig[callType] || { label: callType, bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Helper para obtener badge del tipo de tarea
  const getTaskTypeBadge = (taskType: string | undefined) => {
    if (!taskType) return null;
    
    const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
      'call': { label: 'Llamada', bg: 'bg-blue-100', text: 'text-blue-800' },
      'meeting': { label: 'Reunión', bg: 'bg-purple-100', text: 'text-purple-800' },
      'email': { label: 'Email', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'reminder': { label: 'Recordatorio', bg: 'bg-orange-100', text: 'text-orange-800' },
    };

    const config = typeConfig[taskType] || { label: taskType, bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Helper para obtener badge del tipo de nota
  const getNoteTypeBadge = (noteType: string | undefined) => {
    if (!noteType) return null;
    
    const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
      'comment': { label: 'Comentario', bg: 'bg-gray-100', text: 'text-gray-800' },
      'call': { label: 'Llamada', bg: 'bg-blue-100', text: 'text-blue-800' },
      'email': { label: 'Email', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'system': { label: 'Sistema', bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = typeConfig[noteType] || { label: noteType, bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
                      // Prioridad: contact_name (del endpoint) > entityNames (cargado) > teléfono > fallback
                      const displayText = call.contact_name || 
                        (call.entity_id && entityNames[call.entity_id] ? entityNames[call.entity_id] : null) ||
                        call.phone || 
                        call.phone_number || 
                        (call.direction === 'inbound' ? 'Llamada entrante' : 'Llamada saliente');
                      
                      return (
                        <div
                          key={call.id}
                          className={`text-xs p-1 rounded cursor-pointer flex items-center gap-1 ${getCallStatusClasses(call)}`}
                          onClick={() => {
                            // Usar contact_id si está disponible (endpoints de calendario), sino usar entity_id con entity_type
                            if (call.contact_id) {
                              navigate(`/crm/contacts/${call.contact_id}`);
                            } else if (call.entity_id) {
                              navigate(`/crm/contacts/${call.entity_id}`);
                            } else if (call.phone || call.phone_number) {
                              // Si no hay entity_id, al menos mostrar información de la llamada
                              console.log('📞 [CRMTaskCalendar] Llamada sin contacto asociado:', call);
                            }
                          }}
                          title={call.contact_name ? `Llamada con ${call.contact_name}` : (call.phone || call.phone_number || 'Llamada')}
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
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
                            navigate(`/crm/contacts/${task.entity_id}`);
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
                  // Prioridad: contact_name (del endpoint) > entityNames (cargado) > teléfono > fallback
                  const displayTitle = call.contact_name || 
                    (call.entity_id && entityNames[call.entity_id] ? entityNames[call.entity_id] : null) ||
                    call.phone || 
                    call.phone_number || 
                    (call.direction === 'inbound' ? 'Llamada entrante' : 'Llamada saliente');
                  
                  return (
                    <div
                      key={call.id}
                      className={`text-xs p-2 rounded cursor-pointer ${getCallStatusClasses(call)}`}
                      onClick={() => {
                        // Usar contact_id si está disponible (endpoints de calendario), sino usar entity_id con entity_type
                        if (call.contact_id) {
                          navigate(`/crm/contacts/${call.contact_id}`);
                        } else if (call.entity_id) {
                          navigate(`/crm/contacts/${call.entity_id}`);
                        } else {
                          console.log('📞 [CRMTaskCalendar] Llamada sin contacto asociado:', call);
                        }
                      }}
                      title={call.contact_name ? `Llamada con ${call.contact_name}` : (call.phone || call.phone_number || 'Llamada')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
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
    const dayNotes = getNotesForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    const hasItems = dayTasks.length > 0 || dayCalls.length > 0 || dayNotes.length > 0;
    
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
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {task.complete_till && (
                            <span>
                              {new Date(task.complete_till).toLocaleString('es-ES')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTaskTypeBadge(task.task_type ?? undefined)}
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.is_completed ? 'Completada' : 'Pendiente'}
                          </span>
                          {task.responsible_user_id && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
                              <User size={12} className="flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{getResponsibleName(task.responsible_user_id)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {task.entity_id && task.entity_type && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/crm/contacts/${task.entity_id}`);
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
              // Prioridad: contact_name (del endpoint) > entityNames (cargado) > teléfono > fallback
              const displayTitle = call.contact_name || 
                (call.entity_id && entityNames[call.entity_id] ? entityNames[call.entity_id] : null) ||
                call.phone || 
                call.phone_number || 
                (call.direction === 'inbound' ? 'Llamada entrante' : 'Llamada saliente');
              
              const isNoAnswer = (call.call_status || call.status) === 'no_answer';
              return (
                <Card
                  key={call.id}
                  className={`cursor-pointer hover:shadow-md ${isNoAnswer ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}
                  onClick={() => {
                    // Usar contact_id si está disponible (endpoints de calendario), sino usar entity_id con entity_type
                    if (call.contact_id) {
                      navigate(`/crm/contacts/${call.contact_id}`);
                    } else if (call.entity_id) {
                      const entityType = call.entity_type === 'leads' || call.entity_type === 'lead' ? 'leads' : 'contacts';
                      navigate(`/crm/${entityType}/${call.entity_id}`);
                    } else {
                      console.log('📞 [CRMTaskCalendar] Llamada sin contacto asociado:', call);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {displayTitle}
                          </h3>
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Grabada: {callDate.toLocaleString('es-ES')}</span>
                              {call.duration && call.duration > 0 && (
                                <span>Duración: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                            {(call.phone || call.phone_number) && (
                              <p className="text-sm text-gray-500">
                                Tel: {call.phone || call.phone_number}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded ${
                                call.call_status === 'completed' || call.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : (call.call_status === 'no_answer' || call.status === 'no_answer')
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {formatCallStatus(call.call_status || call.status)}
                              </span>
                              {getCallTypeBadge(call.call_type)}
                              {call.responsible_user_id && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
                                  <User size={12} className="flex-shrink-0" />
                                  <span className="truncate max-w-[150px]">{getResponsibleName(call.responsible_user_id)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {/* Notas */}
            {dayNotes.map(note => {
              const noteDate = new Date(note.created_at);
              return (
                <Card
                  key={note.id}
                  className="cursor-pointer hover:shadow-md bg-gray-50 border-gray-200"
                  onClick={() => {
                    if (note.entity_id) {
                      navigate(`/crm/contacts/${note.entity_id}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageSquare className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {note.content}
                          </p>
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Creada: {noteDate.toLocaleString('es-ES')}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getNoteTypeBadge(note.note_type ?? undefined)}
                              {note.created_by && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
                                  <User size={12} className="flex-shrink-0" />
                                  <span className="truncate max-w-[150px]">{getResponsibleName(note.created_by)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No hay tareas, llamadas ni notas para este día
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


