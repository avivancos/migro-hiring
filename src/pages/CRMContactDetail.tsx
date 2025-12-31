// CRM Contact Detail - Vista detallada de contacto con pestañas

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { crmService } from '@/services/crmService';
import type { KommoContact, Task, Call, Note, CallCreateRequest, TaskCreateRequest, NoteCreateRequest } from '@/types/crm';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Flag,
  Star,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  User,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { CallForm } from '@/components/CRM/CallForm';
import { TaskForm } from '@/components/CRM/TaskForm';
import { NoteForm } from '@/components/CRM/NoteForm';
import { ContactCustomFields } from '@/components/CRM/ContactCustomFields';
import type { CRMUser } from '@/types/crm';
import { useAuth } from '@/providers/AuthProvider';
import { Trash2 } from 'lucide-react';
import { formatCallStatus } from '@/utils/statusTranslations';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PipelineWizardModal } from '@/components/pipelines/Wizards/PipelineWizardModal';
import { opportunityApi } from '@/services/opportunityApi';
import type { LeadOpportunity } from '@/types/opportunity';
import { Briefcase } from 'lucide-react';
import { OpportunityPriorityBadge } from '@/components/opportunities/OpportunityPriorityBadge';
import { OpportunityScore } from '@/components/opportunities/OpportunityScore';
import { getDetectionReasonBadges } from '@/utils/opportunity';

export function CRMContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<KommoContact | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [activeTab, setActiveTab] = useState('history');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showEditProximaAccion, setShowEditProximaAccion] = useState(false);
  const [editingProximaAccionFecha, setEditingProximaAccionFecha] = useState('');
  const [editingProximaAccionType, setEditingProximaAccionType] = useState<'call' | 'task' | null>(null);
  const [editingProximaAccionId, setEditingProximaAccionId] = useState<string | null>(null);
  const [editingProximaAccionField, setEditingProximaAccionField] = useState<'proxima_accion_fecha' | 'proxima_llamada_fecha' | 'complete_till' | null>(null);
  const [updatingProximaAccion, setUpdatingProximaAccion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPipelineWizard, setShowPipelineWizard] = useState(false);
  const [relatedOpportunities, setRelatedOpportunities] = useState<LeadOpportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const { isAdmin } = useAuth();
  
  // Ref para evitar recargas innecesarias
  const lastLoadTime = useRef<number>(0);
  const lastLoadId = useRef<string | undefined>(undefined);
  const MIN_RELOAD_INTERVAL = 30000; // 30 segundos mínimo entre recargas

  // Definir loadContactData primero para que pueda ser usada en el callback
  const loadContactData = useCallback(async () => {
    if (!id || id === 'new') return; // No cargar si es "new"
    setLoading(true);
    try {
      // Cargar datos en paralelo
      // Nota: getContactLeads ya no existe porque los leads están unificados con contactos
      const [contactData, tasksData, callsData, notesData, usersData] = await Promise.all([
        crmService.getContact(id).catch((err) => {
          // Si el contacto no existe, pero puede haber llamadas/tareas/notas asociadas
          console.warn('⚠️ [CRMContactDetail] Contacto no encontrado, pero continuando con actividades:', err);
          return null;
        }),
        crmService.getContactTasks(id, { limit: 50 }).catch(() => ({ items: [] })),
        crmService.getContactCalls(id, { limit: 50 }).catch(() => ({ items: [] })),
        crmService.getContactNotes(id, { limit: 50 }).catch(() => ({ items: [] })),
        crmService.getUsers(true).catch(() => []),
      ]);
      
      if (!contactData) {
        setError('Contacto no encontrado');
        setContact(null);
      } else {
        setContact(contactData);
        setError(null);
      }
      
      setTasks(tasksData.items || []);
      
      // Ordenar llamadas de más recientes a más antiguas
      const sortedCalls = (callsData.items || []).sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at).getTime();
        const dateB = new Date(b.started_at || b.created_at).getTime();
        return dateB - dateA; // Descendente (más recientes primero)
      });
      setCalls(sortedCalls);
      
      setNotes(notesData.items || []);
      setUsers(usersData);
      
      // Cargar oportunidades relacionadas (filtrar por contact_id)
      // Si existe relación 1:1, cargar todas las oportunidades para asegurar encontrar la relacionada
      if (contactData?.id) {
        setLoadingOpportunities(true);
        try {
          // Cargar todas las oportunidades paginando si es necesario
          // Ya que existe relación 1:1, debemos asegurarnos de encontrar la oportunidad relacionada
          let allOpportunities: any[] = [];
          let page = 1;
          const limit = 100;
          let hasMore = true;
          
          while (hasMore) {
            const oppsResponse = await opportunityApi.list({ limit, page });
            const opportunities = oppsResponse.opportunities || [];
            allOpportunities.push(...opportunities);
            
            // Si hay menos oportunidades que el límite, no hay más páginas
            hasMore = opportunities.length === limit && 
                      (oppsResponse.total_pages || 0) > page;
            page++;
            
            // Buscar la oportunidad relacionada mientras cargamos
            const found = opportunities.find(
              (opp: any) => opp.contact_id === contactData.id
            );
            if (found) {
              // Si encontramos la oportunidad, no necesitamos cargar más páginas
              setRelatedOpportunities([found]);
              setLoadingOpportunities(false);
              return; // Salir temprano si encontramos la oportunidad
            }
            
            // Limitar a 10 páginas máximo (1000 oportunidades) para evitar loops infinitos
            if (page > 10) {
              console.warn('⚠️ [CRMContactDetail] Límite de páginas alcanzado al buscar oportunidad');
              break;
            }
          }
          
          // Si no encontramos en el loop, buscar en todas las cargadas
          const related = allOpportunities.filter(
            (opp: any) => opp.contact_id === contactData.id
          );
          setRelatedOpportunities(related);
          
          if (related.length === 0) {
            console.warn(`⚠️ [CRMContactDetail] No se encontró oportunidad para contacto ${contactData.id} después de cargar ${allOpportunities.length} oportunidades`);
          }
        } catch (err) {
          console.error('Error cargando oportunidades:', err);
          setRelatedOpportunities([]);
        } finally {
          setLoadingOpportunities(false);
        }
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
      setError('Error al cargar los datos del contacto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Memoizar loadContactData para evitar recrearla
  const loadContactDataMemo = useCallback(async () => {
    if (!id || id === 'new') return; // No cargar si es "new"
    
    // Evitar recargas muy frecuentes
    const now = Date.now();
    if (
      lastLoadId.current === id &&
      now - lastLoadTime.current < MIN_RELOAD_INTERVAL
    ) {
      console.log('⏭️ [CRMContactDetail] Saltando recarga (muy reciente)');
      return;
    }
    
    lastLoadTime.current = now;
    lastLoadId.current = id;
    
    await loadContactData();
  }, [id, loadContactData]);

  useEffect(() => {
    // Solo cargar si el ID existe y no es "new" (que debe manejarse por la ruta específica)
    if (id && id !== 'new') {
      loadContactDataMemo();
    } else if (!id) {
      // Si no hay ID, no hacer nada (puede ser un estado transitorio)
      setLoading(false);
    }
  }, [id, searchParams.toString(), loadContactDataMemo]); // Recargar cuando cambia la query string (útil después de editar)

  // Recargar datos cuando se navega a esta página (útil después de editar)
  // OPTIMIZADO: Solo recargar si han pasado más de 30 segundos desde la última carga
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        const now = Date.now();
        // Solo recargar si han pasado más de 30 segundos desde la última carga
        if (now - lastLoadTime.current > MIN_RELOAD_INTERVAL) {
          console.log('🔄 [CRMContactDetail] Recargando datos (pestaña visible después de 30s)');
          loadContactDataMemo();
        } else {
          console.log('⏭️ [CRMContactDetail] Saltando recarga (datos recientes)');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, loadContactDataMemo]);

  // Actualizar título de la página con el nombre del contacto
  const contactName = contact 
    ? (contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Contacto')
    : null;
  usePageTitle(contactName ? `${contactName} - Detalle de Contacto | Migro.es` : undefined);

  // Obtener nombre del usuario por ID
  const getUserName = (userId?: string): string => {
    if (!userId) return 'No especificado';
    
    if (users.length === 0) {
      return 'Cargando...';
    }
    
    const user = users.find(u => String(u.id).trim() === String(userId).trim());
    if (!user) {
      return `Usuario ${userId.slice(0, 8)}...`;
    }
    
    // Usar name (que debería contener el nombre completo del usuario del CRM)
    const name = user.name?.trim();
    if (name && name.length > 0) {
      return name;
    }
    
    // Fallback a email si no hay name
    return user.email || `Usuario ${userId.slice(0, 8)}...`;
  };

  // Crear timeline unificado de actividades
  interface TimelineItem {
    id: string;
    type: 'call' | 'task' | 'note';
    date: string;
    data: Call | Task | Note;
  }

  // Memoizar timeline items para evitar recalcular en cada render
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Agregar llamadas
    calls.forEach(call => {
      items.push({
        id: `call-${call.id}`,
        type: 'call',
        date: call.started_at || call.created_at,
        data: call,
      });
    });

    // Agregar tareas
    tasks.forEach(task => {
      items.push({
        id: `task-${task.id}`,
        type: 'task',
        date: task.created_at,
        data: task,
      });
    });

    // Agregar notas
    notes.forEach(note => {
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        date: note.created_at,
        data: note,
      });
    });

    // Ordenar por fecha (más recientes primero)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [calls, tasks, notes]);

  const getGradingColor = (grading?: 'A' | 'B+' | 'B-' | 'C'): string => {
    switch (grading) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B+':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B-':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper para obtener el trámite sugerido
  const getTramiteSugerido = (): string | null => {
    const servicioPropuesto = contact?.custom_fields?.servicio_propuesto;
    if (!servicioPropuesto) return null;
    
    const tramiteMap: Record<string, string> = {
      'asilo_proteccion_internacional': 'Asilo/Protección Internacional',
      'arraigo': 'Arraigo',
      'reagrupacion_familiar': 'Reagrupación Familiar',
      'nacionalidad': 'Nacionalidad',
    };
    
    return tramiteMap[servicioPropuesto] || servicioPropuesto;
  };

  // Helper para obtener la fecha de próxima llamada/acción y su origen
  const getProximaAccionInfo = (): { fecha: string | null; type: 'call' | 'task' | null; id: string | null; field: 'proxima_accion_fecha' | 'proxima_llamada_fecha' | 'complete_till' | null } => {
    if (!calls || calls.length === 0) {
      // Solo buscar en tareas si no hay llamadas
      if (tasks && tasks.length > 0) {
        const now = new Date().getTime();
        const tareasPendientes = tasks.filter(t => !t.is_completed && t.complete_till);
        let proximaFecha: string | null = null;
        let taskId: string | null = null;
        
        for (const task of tareasPendientes) {
          if (task.complete_till) {
            const fecha = new Date(task.complete_till).getTime();
            if (fecha > now) {
              if (!proximaFecha || fecha < new Date(proximaFecha).getTime()) {
                proximaFecha = task.complete_till;
                taskId = task.id;
              }
            }
          }
        }
        
        return { fecha: proximaFecha, type: taskId ? 'task' : null, id: taskId, field: 'complete_till' };
      }
      return { fecha: null, type: null, id: null, field: null };
    }
    
    // Buscar en las llamadas más recientes
    const now = new Date().getTime();
    let proximaFecha: string | null = null;
    let callId: string | null = null;
    let field: 'proxima_accion_fecha' | 'proxima_llamada_fecha' | null = null;
    
    // Buscar proxima_accion_fecha primero (más específico)
    for (const call of calls) {
      if (call.proxima_accion_fecha) {
        const fecha = new Date(call.proxima_accion_fecha).getTime();
        if (fecha > now) {
          if (!proximaFecha || fecha < new Date(proximaFecha).getTime()) {
            proximaFecha = call.proxima_accion_fecha;
            callId = call.id;
            field = 'proxima_accion_fecha';
          }
        }
      }
    }
    
    // Si no hay proxima_accion_fecha, buscar proxima_llamada_fecha
    if (!proximaFecha) {
      for (const call of calls) {
        if (call.proxima_llamada_fecha) {
          const fecha = new Date(call.proxima_llamada_fecha).getTime();
          if (fecha > now) {
            if (!proximaFecha || fecha < new Date(proximaFecha).getTime()) {
              proximaFecha = call.proxima_llamada_fecha;
              callId = call.id;
              field = 'proxima_llamada_fecha';
            }
          }
        }
      }
    }
    
    // También buscar en tareas pendientes si no hay fecha en llamadas
    if (!proximaFecha && tasks && tasks.length > 0) {
      const tareasPendientes = tasks.filter(t => !t.is_completed && t.complete_till);
      for (const task of tareasPendientes) {
        if (task.complete_till) {
          const fecha = new Date(task.complete_till).getTime();
          if (fecha > now) {
            if (!proximaFecha || fecha < new Date(proximaFecha).getTime()) {
              proximaFecha = task.complete_till;
              callId = null;
              return { fecha: proximaFecha, type: 'task', id: task.id, field: 'complete_till' };
            }
          }
        }
      }
    }
    
    return { fecha: proximaFecha, type: callId ? 'call' : null, id: callId, field };
  };

  // Helper para obtener solo la fecha (compatibilidad)
  const getProximaAccionFecha = (): string | null => {
    return getProximaAccionInfo().fecha;
  };

  // Función para abrir el modal de edición de próxima acción
  const handleEditProximaAccion = () => {
    const info = getProximaAccionInfo();
    if (info.fecha && info.id && info.type && info.field) {
      setEditingProximaAccionFecha(new Date(info.fecha).toISOString().slice(0, 16));
      setEditingProximaAccionType(info.type);
      setEditingProximaAccionId(info.id);
      setEditingProximaAccionField(info.field);
      setShowEditProximaAccion(true);
    }
  };

  // Función para guardar la fecha de próxima acción
  const handleSaveProximaAccion = async () => {
    if (!editingProximaAccionId || !editingProximaAccionType || !editingProximaAccionFecha || !editingProximaAccionField) return;
    
    setUpdatingProximaAccion(true);
    try {
      if (editingProximaAccionType === 'call') {
        const updates: any = {};
        if (editingProximaAccionField === 'proxima_accion_fecha') {
          updates.proxima_accion_fecha = new Date(editingProximaAccionFecha).toISOString();
        } else if (editingProximaAccionField === 'proxima_llamada_fecha') {
          updates.proxima_llamada_fecha = new Date(editingProximaAccionFecha).toISOString();
        }
        await crmService.updateCall(editingProximaAccionId, updates);
      } else if (editingProximaAccionType === 'task') {
        await crmService.updateTask(editingProximaAccionId, {
          complete_till: new Date(editingProximaAccionFecha).toISOString(),
        });
      }
      
      await loadContactData();
      setShowEditProximaAccion(false);
      setEditingProximaAccionFecha('');
      setEditingProximaAccionType(null);
      setEditingProximaAccionId(null);
      setEditingProximaAccionField(null);
    } catch (err: any) {
      console.error('Error updating próxima acción:', err);
      alert('Error al actualizar la fecha de próxima acción');
    } finally {
      setUpdatingProximaAccion(false);
    }
  };

  const handleCallSubmit = async (callData: CallCreateRequest) => {
    if (!id) return;
    try {
      const finalCallData: CallCreateRequest = {
        ...callData,
        entity_type: 'contacts',
        entity_id: id,
        // Asegurar que started_at esté presente (requerido por el backend)
        started_at: callData.started_at || new Date().toISOString(),
      };
      await crmService.createCall(finalCallData);
      await loadContactData();
      setShowCallForm(false);
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error creating call:', err);
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      alert('Error al crear la llamada');
    }
  };

  const handleTaskSubmit = async (taskData: TaskCreateRequest) => {
    if (!id) return;
    try {
      const finalTaskData: TaskCreateRequest = {
        ...taskData,
        entity_type: 'contacts',
        entity_id: id,
      };
      await crmService.createTask(finalTaskData);
      await loadContactData();
      setShowTaskForm(false);
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error creating task:', err);
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      alert('Error al crear la tarea');
    }
  };

  const handleNoteSubmit = async (noteData: NoteCreateRequest) => {
    if (!id) return;
    try {
      // Validar que el contenido no esté vacío
      if (!noteData.content || noteData.content.trim().length === 0) {
        alert('El contenido de la nota no puede estar vacío');
        return;
      }

      const finalNoteData: NoteCreateRequest = {
        ...noteData,
        entity_type: 'contacts',
        entity_id: id,
        content: noteData.content.trim(), // Limpiar espacios en blanco
      };

      // Remover campos vacíos o undefined
      const cleanNoteData: NoteCreateRequest = {
        entity_type: finalNoteData.entity_type,
        entity_id: finalNoteData.entity_id,
        content: finalNoteData.content,
      };

      // Solo agregar note_type si existe y no está vacío (default: "comment")
      if (noteData.note_type && noteData.note_type.trim()) {
        cleanNoteData.note_type = noteData.note_type;
      } else {
        // Si no viene note_type, usar "comment" como default según la documentación
        cleanNoteData.note_type = 'comment';
      }

      // Solo agregar params si existen
      if (noteData.params && Object.keys(noteData.params).length > 0) {
        cleanNoteData.params = noteData.params;
      }

      console.log('📝 [CRMContactDetail] Enviando nota:', cleanNoteData);
      await crmService.createNote(cleanNoteData);
      await loadContactData();
      setShowNoteForm(false);
      setActiveTab('history');
    } catch (err: any) {
      console.error('❌ [CRMContactDetail] Error creating note:', err);
      console.error('❌ [CRMContactDetail] Error response:', err?.response?.data);
      console.error('❌ [CRMContactDetail] Error detail:', err?.response?.data?.detail);
      
      // Mostrar mensaje de error específico del backend
      let errorMessage = 'Error al crear la nota';
      
      if (err?.response?.status === 422) {
        const errorDetail = err?.response?.data?.detail;
        console.log('🔍 [CRMContactDetail] Error detail type:', typeof errorDetail, errorDetail);
        
        if (Array.isArray(errorDetail) && errorDetail.length > 0) {
          // Si es un array de errores de validación (formato FastAPI/Pydantic)
          const errorMessages = errorDetail.map((e: any) => {
            const field = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : (e.loc?.join('.') || 'campo');
            const msg = e.msg || 'Error de validación';
            const type = e.type || '';
            return `${field}: ${msg}${type ? ` (${type})` : ''}`;
          }).join('\n');
          errorMessage = `Error de validación:\n${errorMessages}`;
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        } else if (errorDetail?.message) {
          errorMessage = errorDetail.message;
        } else if (errorDetail && typeof errorDetail === 'object') {
          // Intentar extraer mensaje de objeto de error
          errorMessage = JSON.stringify(errorDetail, null, 2);
        }
      } else if (err?.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  // La autenticación se maneja con ProtectedRoute en App.tsx

  const handleDeleteContact = async () => {
    if (!id || !contact) return;
    
    // Confirmación doble para evitar eliminaciones accidentales
    const confirmMessage = `¿Estás seguro de que deseas eliminar el contacto "${contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    // Segunda confirmación
    if (!window.confirm('Esta acción es permanente. ¿Continuar con la eliminación?')) {
      return;
    }
    
    setDeleting(true);
    try {
      await crmService.deleteContact(id);
      // Navegar a la lista de contactos después de eliminar
      navigate('/crm/contacts');
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error al eliminar el contacto';
      alert(`Error al eliminar el contacto: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contacto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error o no hay contacto, mostrar mensaje de error
  if (error || !contact) {
    return (
      <div className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-900 font-semibold mb-4">{error || 'Contacto no encontrado'}</p>
                <p className="text-sm text-gray-600 mb-4">
                  El contacto con ID {id} no existe en el sistema.
                </p>
                <Button onClick={() => navigate('/crm/contacts')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Contactos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
              variant="outline"
                onClick={() => navigate('/crm/contacts')}
                className="flex-shrink-0"
              >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
              </Button>
              <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Contacto</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/crm/contacts/${id}/edit`)}
                className="flex-1 sm:flex-initial"
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Editar</span>
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={handleDeleteContact}
                  disabled={deleting}
                  className="flex-1 sm:flex-initial border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="sm:inline">{deleting ? 'Eliminando...' : 'Eliminar'}</span>
                </Button>
              )}
          </div>
        </div>
        {/* Datos Básicos Destacados */}
        <Card className="mb-4 sm:mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-3 sm:pt-4 md:pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* Columna 1: Información de Contacto */}
              <div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-green-600 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-white flex-shrink-0">
                    {(contact.name || contact.first_name || 'C')[0].toUpperCase()}
                    {(contact.last_name || contact.name?.split(' ')[1] || '')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                      {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                    </h2>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{contact.mobile}</span>
                    </div>
                  )}
                  {contact.nacionalidad && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Flag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{contact.nacionalidad}</span>
                    </div>
                  )}
                  {contact.city && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{contact.city}{contact.state ? `, ${contact.state}` : ''}</span>
                    </div>
                  )}
                  {contact.state && !contact.city && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Provincia: {contact.state}</span>
                    </div>
                  )}
                  {/* Responsable/Agente asignado a través de la oportunidad */}
                  {relatedOpportunities.length > 0 && relatedOpportunities[0]?.assigned_to && (
                    <div className="flex items-center gap-2 text-gray-700 mt-3 pt-3 border-t border-gray-200">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Responsable</span>
                        <span className="text-sm font-medium text-gray-900">
                          {relatedOpportunities[0].assigned_to.name || 
                           relatedOpportunities[0].assigned_to.email || 
                           'Sin asignar'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna 2: Situación Administrativa */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Situación</h3>
                <div className="space-y-2">
                  {contact.tiempo_espana && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Tiempo en España: </span>
                      <span>{contact.tiempo_espana}</span>
                    </div>
                  )}
                  {contact.custom_fields?.fecha_llegada_espana && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Fecha de Llegada: </span>
                      <span>{new Date(contact.custom_fields.fecha_llegada_espana).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Empadronado: </span>
                    <span>{contact.empadronado ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Trabaja: </span>
                    <span>{contact.trabaja_b ? 'Sí' : 'No'}</span>
                  </div>
                  {contact.position && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Profesión: </span>
                      <span>{contact.position}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Familiares en España: </span>
                    <span>{contact.tiene_familiares_espana ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Columna 3: Evaluación */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Evaluación</h3>
                <div className="flex flex-col gap-3">
                  {/* Gradings */}
                  {(contact.grading_llamada || contact.grading_situacion) && (
                    <div className="flex flex-col gap-2">
                      {contact.grading_llamada && (
                        <div>
                          <span className="text-xs text-gray-600 mb-1 block">Interés (Llamada)</span>
                          <span
                            className={`inline-block text-sm px-3 py-2 rounded-full border ${getGradingColor(
                              contact.grading_llamada
                            )}`}
                          >
                            <Star className="w-3 h-3 inline mr-1" />
                            {contact.grading_llamada}
                          </span>
                        </div>
                      )}
                      {contact.grading_situacion && (
                        <div>
                          <span className="text-xs text-gray-600 mb-1 block">Situación Administrativa</span>
                          <span
                            className={`inline-block text-sm px-3 py-2 rounded-full border ${getGradingColor(
                              contact.grading_situacion
                            )}`}
                          >
                            <Star className="w-3 h-3 inline mr-1" />
                            {contact.grading_situacion}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Trámite Sugerido */}
                  {getTramiteSugerido() && (
                    <div>
                      <span className="text-xs text-gray-600 mb-1 block">Trámite Sugerido</span>
                      <div className="flex items-center gap-2 text-sm text-gray-900 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{getTramiteSugerido()}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Fecha de Nueva Llamada / Acción */}
                  {getProximaAccionFecha() && (
                    <div>
                      <span className="text-xs text-gray-600 mb-1 block">Fecha de Nueva Llamada / Acción</span>
                      <div className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-2 ${
                        new Date(getProximaAccionFecha()!).getTime() < new Date().getTime()
                          ? 'bg-red-50 border border-red-200 text-red-700 font-semibold'
                          : 'bg-green-50 border border-green-200 text-green-700'
                      }`}>
                        <div className="flex items-center gap-2 flex-1">
                          <Calendar className={`w-4 h-4 ${
                            new Date(getProximaAccionFecha()!).getTime() < new Date().getTime()
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`} />
                          <span>{formatDate(getProximaAccionFecha()!)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleEditProximaAccion}
                          className="h-7 px-2 text-xs hover:bg-white/50"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Mensaje si no hay información de evaluación */}
                  {!contact.grading_llamada && !contact.grading_situacion && !getTramiteSugerido() && !getProximaAccionFecha() && (
                    <div className="text-xs text-gray-500 italic">
                      No hay información de evaluación disponible
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t border-green-200">
              <Button
                onClick={() => setShowCallForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Nueva Llamada</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTaskForm(true)}
                className="bg-white hover:bg-green-50 flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Nueva Tarea</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNoteForm(true)}
                className="bg-white hover:bg-green-50 flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Nueva Nota</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPipelineWizard(true)}
                className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Pipeline</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Oportunidad Enlazada - Siempre visible */}
        {relatedOpportunities.length > 0 ? (
          <Card className="mb-4 sm:mb-6 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Oportunidad Enlazada
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/crm/opportunities/${relatedOpportunities[0].id}`)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Detalle Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Score y Prioridad */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Score</span>
                      <span className="text-sm text-gray-500">
                        {relatedOpportunities[0].opportunity_score}/100
                      </span>
                    </div>
                    <OpportunityScore score={relatedOpportunities[0].opportunity_score} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Prioridad</span>
                    <OpportunityPriorityBadge priority={relatedOpportunities[0].priority} />
                  </div>
                </div>

                {/* Estado y Razón de Detección */}
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Estado</span>
                    <Badge
                      variant={
                        relatedOpportunities[0].status === 'pending' ? 'neutral' :
                        relatedOpportunities[0].status === 'assigned' ? 'info' :
                        relatedOpportunities[0].status === 'contacted' ? 'info' :
                        relatedOpportunities[0].status === 'converted' ? 'success' :
                        relatedOpportunities[0].status === 'expired' ? 'warning' : 'error'
                      }
                    >
                      {relatedOpportunities[0].status === 'pending' ? 'Pendiente' :
                       relatedOpportunities[0].status === 'assigned' ? 'Asignada' :
                       relatedOpportunities[0].status === 'contacted' ? 'Contactada' :
                       relatedOpportunities[0].status === 'converted' ? 'Convertida' :
                       relatedOpportunities[0].status === 'expired' ? 'Expirada' : 'Perdida'}
                    </Badge>
                  </div>
                  {relatedOpportunities[0].detection_reason && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-2">Razón de Detección</span>
                      <div className="flex flex-wrap gap-2">
                        {getDetectionReasonBadges(relatedOpportunities[0].detection_reason).map((badge, index) => (
                          <Badge key={index} variant="neutral" className="text-sm">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {relatedOpportunities[0].assigned_to && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-1">Asignada a</span>
                      <span className="text-sm text-gray-900">
                        {relatedOpportunities[0].assigned_to.name || 
                         relatedOpportunities[0].assigned_to.email || 
                         'Sin asignar'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4 sm:mb-6 border-2 border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                Oportunidad Enlazada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center py-4">
                No hay oportunidad enlazada a este contacto
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full mb-6">
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0 pb-2">
              <TabsList className="mb-6 min-w-max w-full sm:w-auto inline-flex h-auto gap-1">
                <TabsTrigger value="info" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  <span className="hidden sm:inline">Información</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  <span className="hidden sm:inline">Oportunidades</span>
                  <span className="sm:hidden">Opps</span>
                  <span className="ml-1 text-xs">({relatedOpportunities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  Tareas <span className="ml-1 text-xs">({tasks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="calls" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  Llamadas <span className="ml-1 text-xs">({calls.length})</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  Notas <span className="ml-1 text-xs">({notes.length})</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 flex-shrink-0">
                  Historial
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Contenido de Pestañas */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Información del Migrante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Información Básica</h3>
                    <div className="space-y-3">
                      {contact.nacionalidad && (
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Nacionalidad:</span>
                          <span className="text-sm font-medium">{contact.nacionalidad}</span>
                        </div>
                      )}
                      {contact.edad && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Edad:</span>
                          <span className="text-sm font-medium">{contact.edad} años</span>
                        </div>
                      )}
                      {contact.tiempo_espana && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Tiempo en España:</span>
                          <span className="text-sm font-medium">{contact.tiempo_espana}</span>
                        </div>
                      )}
                      {contact.custom_fields?.fecha_llegada_espana && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Fecha de Llegada:</span>
                          <span className="text-sm font-medium">
                            {new Date(contact.custom_fields.fecha_llegada_espana).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {contact.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Ciudad:</span>
                          <span className="text-sm font-medium">{contact.city}</span>
                        </div>
                      )}
                      {contact.state && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Provincia:</span>
                          <span className="text-sm font-medium">{contact.state}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Situación</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Empadronado:</span>
                        <span className="text-sm font-medium">
                          {contact.empadronado ? 'Sí' : 'No'}
                        </span>
                      </div>
                      {contact.lugar_residencia && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Residencia:</span>
                          <span className="text-sm font-medium">{contact.lugar_residencia}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tiene ingresos:</span>
                        <span className="text-sm font-medium">
                          {contact.tiene_ingresos ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Trabaja (B):</span>
                        <span className="text-sm font-medium">
                          {contact.trabaja_b ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Familiares en España:</span>
                        <span className="text-sm font-medium">
                          {contact.tiene_familiares_espana ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campos Personalizados */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <ContactCustomFields contactId={id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Oportunidades Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOpportunities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedOpportunities.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <h4 className="font-semibold text-gray-900">
                                Oportunidad #{opportunity.id.slice(0, 8)}
                              </h4>
                              {opportunity.priority && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {opportunity.priority === 'high' ? 'Alta' :
                                   opportunity.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Score:</span> {opportunity.opportunity_score}/100
                              </p>
                              <p>
                                <span className="font-medium">Estado:</span> {
                                  opportunity.status === 'pending' ? 'Pendiente' :
                                  opportunity.status === 'assigned' ? 'Asignada' :
                                  opportunity.status === 'contacted' ? 'Contactada' :
                                  opportunity.status === 'converted' ? 'Convertida' :
                                  opportunity.status === 'expired' ? 'Expirada' : 'Perdida'
                                }
                              </p>
                              {opportunity.assigned_to && (
                                <p>
                                  <span className="font-medium">Asignada a:</span> {opportunity.assigned_to.name}
                                </p>
                              )}
                              {opportunity.detected_at && (
                                <p>
                                  <span className="font-medium">Detectada:</span>{' '}
                                  {new Date(opportunity.detected_at).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/crm/opportunities/${opportunity.id}`);
                            }}
                            className="flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver Detalle
                          </Button>
                        </div>
                      </div>
                    ))}
                    {relatedOpportunities.length === 0 && !loadingOpportunities && (
                      <p className="text-center text-gray-500 py-8">No hay oportunidades asociadas a este contacto</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tareas</CardTitle>
                  <Button size="sm" onClick={() => setShowTaskForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.is_completed
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {task.is_completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            )}
                            <h4
                              className={`font-semibold ${
                                task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}
                            >
                              {task.text}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(task.complete_till || task.due_date)}
                          </p>
                        </div>
                        {task.entity_id && task.entity_type && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/crm/contacts/${task.entity_id}`);
                            }}
                            className="ml-4"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver contacto
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay tareas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Llamadas</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowCallForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Llamada
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calls.map((call) => (
                    <div key={call.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {call.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                            </span>
                            <span className="text-sm text-gray-600">{call.phone || call.phone_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{formatDate(call.started_at || call.created_at)}</span>
                            </div>
                            {call.duration > 0 && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>Duración: {formatDuration(call.duration)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              (call.call_status === 'completed' || call.status === 'answered' || call.status === 'completed')
                                ? 'bg-green-100 text-green-800'
                                : (call.call_status === 'no_answer' || call.status === 'no_answer')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(call.call_status || call.status || 'unknown') === 'completed' ? 'Llamada efectiva' : 
                             (call.call_status || call.status || 'unknown') === 'no_answer' ? 'Sin respuesta' : 
                             (call.call_status || call.status || 'unknown')}
                          </span>
                          {call.entity_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/crm/contacts/${call.entity_id}`);
                              }}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver contacto
                            </Button>
                          )}
                        </div>
                      </div>
                      {call.resumen_llamada && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Resumen de la Llamada</p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{call.resumen_llamada}</p>
                        </div>
                      )}
                      {call.call_result && (
                        <p className="text-xs text-gray-600 mt-2">
                          <span className="font-semibold">Resultado:</span> {call.call_result}
                        </p>
                      )}
                      {call.proxima_llamada_fecha && (
                        <p className="text-xs text-gray-500 mt-2">
                          Próxima llamada: {formatDate(call.proxima_llamada_fecha)}
                        </p>
                      )}
                    </div>
                  ))}
                  {calls.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay llamadas registradas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notas</CardTitle>
                  <Button size="sm" onClick={() => setShowNoteForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{note.content}</p>
                        {note.entity_id && note.entity_type && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/crm/contacts/${note.entity_id}`);
                            }}
                            className="ml-4"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver contacto
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(note.created_at)}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay notas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Historial de Actividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timelineItems.length > 0 ? (
                    <div className="relative">
                      {/* Línea vertical del timeline */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {timelineItems.map((item) => {
                        const isCall = item.type === 'call';
                        const isTask = item.type === 'task';
                        const isNote = item.type === 'note';
                        
                        const call = isCall ? (item.data as Call) : null;
                        const task = isTask ? (item.data as Task) : null;
                        const note = isNote ? (item.data as Note) : null;

                        // Determinar el icono y color según el tipo
                        let IconComponent = FileText;
                        let iconBgColor = 'bg-gray-100 text-gray-600';
                        let borderColor = 'border-gray-200';
                        
                        if (isCall) {
                          IconComponent = Phone;
                          iconBgColor = 'bg-blue-100 text-blue-600';
                          borderColor = 'border-blue-200';
                        } else if (isTask) {
                          IconComponent = task?.is_completed ? CheckCircle2 : Clock;
                          iconBgColor = task?.is_completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600';
                          borderColor = task?.is_completed ? 'border-green-200' : 'border-yellow-200';
                        } else if (isNote) {
                          IconComponent = FileText;
                          iconBgColor = 'bg-purple-100 text-purple-600';
                          borderColor = 'border-purple-200';
                        }

                        return (
                          <div key={item.id} className="relative flex items-start gap-2 sm:gap-4 pb-6">
                            {/* Icono */}
                            <div className={`relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full ${iconBgColor} border-2 ${borderColor} flex-shrink-0`}>
                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            
                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className={`p-3 sm:p-4 rounded-lg border-2 ${borderColor} bg-white`}>
                                {/* Header con fecha y usuario */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{formatDate(item.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">
                                      {isCall && call?.responsible_user_id
                                        ? getUserName(call.responsible_user_id)
                                        : isTask && task?.responsible_user_id
                                        ? getUserName(task.responsible_user_id)
                                        : 'Sistema'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Contenido específico por tipo */}
                                {isCall && call && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">
                                          {call.direction === 'inbound' ? 'Llamada Entrante' : 'Llamada Saliente'}
                                        </span>
                                        {call.phone && (
                                          <span className="text-sm text-gray-600">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            {call.phone}
                                          </span>
                                        )}
                                      </div>
                          {call.entity_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/crm/contacts/${call.entity_id}`);
                              }}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver contacto
                            </Button>
                          )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm mb-2">
                                      <div className="flex items-center gap-1 text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{formatDate(call.started_at || call.created_at)}</span>
                                      </div>
                                      {call.duration > 0 && (
                                        <div className="flex items-center gap-1 text-gray-600">
                                          <Clock className="w-4 h-4 text-gray-400" />
                                          <span>Duración: {formatDuration(call.duration || 0)}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <span>Estado: {formatCallStatus(call.call_status || call.status)}</span>
                                      </div>
                                    </div>
                                    {call.resumen_llamada && (
                                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Resumen de la Llamada</p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                          {call.resumen_llamada}
                                        </p>
                                      </div>
                                    )}
                                    {call.proxima_llamada_fecha && (
                                      <p className="text-xs text-blue-600 mt-2">
                                        Próxima llamada: {formatDate(call.proxima_llamada_fecha)}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {isTask && task && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-semibold ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                          {task.text}
                                        </span>
                                        {task.is_completed && (
                                          <CheckCircle2 className="w-4 h-4 text-green-600" />
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
                                          className="text-xs"
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Ver contacto
                                        </Button>
                                      )}
                                    </div>
                                    {task.complete_till && (
                                      <div className="text-sm text-gray-600">
                                        Fecha límite: {formatDate(task.complete_till)}
                                      </div>
                                    )}
                                    {task.task_type && (
                                      <span className="inline-block text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 mt-2">
                                        {task.task_type}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {isNote && note && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="font-semibold text-gray-900">Nota</p>
                                      {note.entity_id && note.entity_type && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/crm/contacts/${note.entity_id}`);
                                          }}
                                          className="text-xs"
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Ver contacto
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {note.content}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay actividades registradas aún</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Modal de Formulario de Llamada */}
      {showCallForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Nueva Llamada</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCallForm(false)}
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  ✕
                </Button>
              </div>
              <CallForm
                defaultEntityType="contacts"
                defaultEntityId={id}
                onSubmit={handleCallSubmit}
                onCancel={() => setShowCallForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario de Tarea */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Nueva Tarea</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTaskForm(false)}
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  ✕
                </Button>
              </div>
              <TaskForm
                defaultEntityType="contacts"
                defaultEntityId={id as any}
                onSubmit={handleTaskSubmit}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario de Nota */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Nueva Nota</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowNoteForm(false)}
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  ✕
                </Button>
              </div>
              <NoteForm
                defaultEntityType="contacts"
                defaultEntityId={id}
                onSubmit={handleNoteSubmit}
                onCancel={() => setShowNoteForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Próxima Acción */}
      {showEditProximaAccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Editar Fecha de Próxima Acción</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditProximaAccion(false);
                    setEditingProximaAccionFecha('');
                    setEditingProximaAccionType(null);
                    setEditingProximaAccionId(null);
                    setEditingProximaAccionField(null);
                  }}
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proxima_accion_fecha_edit">Fecha y Hora</Label>
                  <Input
                    id="proxima_accion_fecha_edit"
                    type="datetime-local"
                    value={editingProximaAccionFecha}
                    onChange={(e) => setEditingProximaAccionFecha(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditProximaAccion(false);
                      setEditingProximaAccionFecha('');
                      setEditingProximaAccionType(null);
                      setEditingProximaAccionId(null);
                      setEditingProximaAccionField(null);
                    }}
                    disabled={updatingProximaAccion}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveProximaAccion}
                    disabled={updatingProximaAccion || !editingProximaAccionFecha}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updatingProximaAccion ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal del Wizard de Pipeline */}
      {id && (
        <PipelineWizardModal
          isOpen={showPipelineWizard}
          onClose={() => setShowPipelineWizard(false)}
          entityType="contacts"
          entityId={id}
          onComplete={(changes) => {
            console.log('Pipeline modificado:', changes);
            // Recargar datos del contacto
            loadContactDataMemo();
          }}
        />
      )}
    </div>
    </>
  );
}

