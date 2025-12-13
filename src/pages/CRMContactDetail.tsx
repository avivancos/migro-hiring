// CRM Contact Detail - Vista detallada de contacto con pestañas

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { crmService } from '@/services/crmService';
import type { KommoContact, KommoLead, Task, Call, Note, CallCreateRequest, TaskCreateRequest, NoteCreateRequest } from '@/types/crm';
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
import { CRMHeader } from '@/components/CRM/CRMHeader';
import { CallForm } from '@/components/CRM/CallForm';
import { TaskForm } from '@/components/CRM/TaskForm';
import { NoteForm } from '@/components/CRM/NoteForm';
import { ContactCustomFields } from '@/components/CRM/ContactCustomFields';
import type { CRMUser } from '@/types/crm';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export function CRMContactDetail() {
  const { isAuthenticated, isValidating, LoginComponent } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<KommoContact | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [activeTab, setActiveTab] = useState('history');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      loadContactData();
    }
  }, [id, isAuthenticated, searchParams.toString()]); // Recargar cuando cambia la query string (útil después de editar)

  // Recargar datos cuando se navega a esta página (útil después de editar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && id) {
        // Recargar datos cuando la pestaña se vuelve visible
        loadContactData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, isAuthenticated]);

  const loadContactData = async () => {
    if (!id) return;
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
      
      setLeads([]); // Los leads están unificados con contactos, no hay leads separados
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
    } catch (error) {
      console.error('Error loading contact data:', error);
      setError('Error al cargar los datos del contacto');
    } finally {
      setLoading(false);
    }
  };

  // Obtener nombre del usuario por ID
  const getUserName = (userId?: string): string => {
    if (!userId) return 'No especificado';
    const user = users.find(u => u.id === userId);
    if (!user) return `Usuario ${userId.slice(0, 8)}...`;
    return user.name?.trim() || user.email || `Usuario ${userId.slice(0, 8)}...`;
  };

  // Crear timeline unificado de actividades
  interface TimelineItem {
    id: string;
    type: 'call' | 'task' | 'note';
    date: string;
    data: Call | Task | Note;
  }

  const getTimelineItems = (): TimelineItem[] => {
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
  };

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

  // Mostrar spinner mientras valida sesión
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
              variant="outline"
                onClick={() => navigate('/crm/contacts')}
              >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
              </Button>
              <div>
              <h1 className="text-3xl font-bold text-gray-900">
                  {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                </h1>
              <p className="text-gray-600 mt-1">Contacto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/crm/contacts/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
          </div>
        </div>
        {/* Datos Básicos Destacados */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna 1: Información de Contacto */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold text-white">
                    {(contact.name || contact.first_name || 'C')[0].toUpperCase()}
                    {(contact.last_name || contact.name?.split(' ')[1] || '')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
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

              {/* Columna 3: Gradings (solo si hay llamadas previas) */}
              {calls.length > 0 && (contact.grading_llamada || contact.grading_situacion) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Evaluación</h3>
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
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-green-200">
              <Button
                onClick={() => setShowCallForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                Nueva Llamada
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTaskForm(true)}
                className="bg-white hover:bg-green-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNoteForm(true)}
                className="bg-white hover:bg-green-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Nueva Nota
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="leads">
              Leads <span className="ml-2 text-xs">({leads.length})</span>
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tareas <span className="ml-2 text-xs">({tasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="calls">
              Llamadas <span className="ml-2 text-xs">({calls.length})</span>
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notas <span className="ml-2 text-xs">({notes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          {/* Contenido de Pestañas */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Información del Migrante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leads</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/crm/leads/new?contact_id=${id}`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Lead
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                          <p className="text-sm text-gray-600">{lead.service_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(lead.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay leads asociados</p>
                  )}
                </div>
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
                              const entityType = task.entity_type === 'leads' || task.entity_type === 'lead' ? 'leads' : 'contacts';
                              navigate(`/crm/${entityType}/${task.entity_id}`);
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
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {call.call_status || call.status || 'unknown'}
                          </span>
                          {call.entity_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Los leads están unificados con contactos, siempre navegar a contacts
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
                              const entityType = note.entity_type === 'leads' || note.entity_type === 'lead' ? 'leads' : 'contacts';
                              navigate(`/crm/${entityType}/${note.entity_id}`);
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
                  {getTimelineItems().length > 0 ? (
                    <div className="relative">
                      {/* Línea vertical del timeline */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {getTimelineItems().map((item) => {
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
                          <div key={item.id} className="relative flex items-start gap-4 pb-6">
                            {/* Icono */}
                            <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${iconBgColor} border-2 ${borderColor}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            
                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className={`p-4 rounded-lg border-2 ${borderColor} bg-white`}>
                                {/* Header con fecha y usuario */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(item.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>
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
                                // Los leads están unificados con contactos, siempre navegar a contacts
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
                                        <span>Estado: {call.call_status || call.status || 'unknown'}</span>
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
                                            const entityType = task.entity_type === 'leads' || task.entity_type === 'lead' ? 'leads' : 'contacts';
                                            navigate(`/crm/${entityType}/${task.entity_id}`);
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
                                            const entityType = note.entity_type === 'leads' || note.entity_type === 'lead' ? 'leads' : 'contacts';
                                            navigate(`/crm/${entityType}/${note.entity_id}`);
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
      </div>

      {/* Modal de Formulario de Llamada */}
      {showCallForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Llamada</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCallForm(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Tarea</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTaskForm(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Nota</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowNoteForm(false)}
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
    </div>
  );
}

