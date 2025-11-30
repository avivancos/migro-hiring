// CRMLeadDetail - Detalle completo de un lead

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, User, Phone, Plus, PhoneCall, RefreshCw, DollarSign, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { KommoLead, Task, Call, Note, TaskCreateRequest, KommoContact, LeadCreateRequest, LeadUpdateRequest } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { LeadForm } from '@/components/CRM/LeadForm';
import { TaskForm } from '@/components/CRM/TaskForm';
import { CRMHeader } from '@/components/CRM/CRMHeader';

export function CRMLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<KommoLead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [createdContact, setCreatedContact] = useState<KommoContact | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewTaskMenu, setShowNewTaskMenu] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState<'first_call' | 'follow_up' | 'note_sale' | null>(null);

  useEffect(() => {
    if (id) {
      loadLeadData();
    }
  }, [id]);

  const loadLeadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Si es "new", usar defaults y no cargar datos relacionados
      if (id === 'new') {
        let leadDefaults: Partial<KommoLead> = {};
        try {
          leadDefaults = await crmService.getLeadDefaults();
        } catch (err) {
          console.warn('No se pudieron cargar los defaults del backend, usando valores por defecto:', err);
          // Continuar con valores por defecto locales
        }
        
        // Crear lead con defaults o valores por defecto
        const newLead: KommoLead = {
          id: 'new',
          name: '',
          price: 0,
          currency: leadDefaults?.currency || 'EUR',
          status: leadDefaults?.status || 'new',
          pipeline_id: leadDefaults?.pipeline_id || '',
          responsible_user_id: leadDefaults?.responsible_user_id || '',
          created_by: '',
          updated_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          priority: leadDefaults?.priority || 'medium',
          service_type: leadDefaults?.service_type || '',
          service_description: leadDefaults?.service_description || '',
          source: leadDefaults?.source || '',
          description: leadDefaults?.description || '',
        } as KommoLead;
        
        setLead(newLead);
        // Para "new", no hay tareas, llamadas ni notas - mostrar arrays vacíos
        setTasks([]);
        setCalls([]);
        setNotes([]);
        // Activar modo de edición automáticamente para nuevo lead
        setEditing(true);
      } else {
        // Lead existente: cargar todo, pero manejar errores silenciosamente
        const [leadData, tasksData, callsData, notesData] = await Promise.all([
          crmService.getLead(id).catch((err) => {
            console.error('Error loading lead:', err);
            throw err; // Re-lanzar para mostrar error de lead
          }),
          // Para tareas, llamadas y notas, si fallan, usar arrays vacíos
          crmService.getTasks({ entity_id: id, entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
          crmService.getCalls({ entity_id: id, entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
          crmService.getNotes({ entity_id: id, entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
        ]);
        setLead(leadData);
        setTasks(tasksData.items || []);
        setCalls(callsData.items || []);
        setNotes(notesData.items || []);
      }
    } catch (err) {
      console.error('Error loading lead data:', err);
      // No mostrar toast de error - solo log en consola
    } finally {
      setLoading(false);
    }
  };

  // Función para validar UUID
  const isUUID = (v?: string | null): boolean => {
    if (!v) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  };

  // Función para construir payload sin valores inválidos
  const buildLeadPayload = (lead: KommoLead, isCreate: boolean = false): LeadCreateRequest | LeadUpdateRequest => {
    const basePayload: any = {
      name: (lead.name ?? '').trim() || 'Nuevo lead',
      pipeline_id: isUUID(lead.pipeline_id) ? lead.pipeline_id : undefined,
      contact_id: isUUID(lead.contact_id) ? lead.contact_id : undefined,
      company_id: isUUID(lead.company_id) ? lead.company_id : undefined,
      responsible_user_id: isUUID(lead.responsible_user_id) ? lead.responsible_user_id : undefined,
      price: Number.isFinite(lead.price) ? lead.price : undefined,
      currency: lead.currency || 'EUR',
      priority: lead.priority || 'medium',
      service_type: lead.service_type || '',
      service_description: lead.service_description || '',
      source: lead.source || '',
      description: lead.description || '',
    };
    
    // status es requerido en LeadCreateRequest pero opcional en LeadUpdateRequest
    if (isCreate) {
      // Para creación, status es requerido
      basePayload.status = lead.status || 'new';
      return basePayload as LeadCreateRequest;
    } else {
      // Para actualización, status es opcional
      if (lead.status) {
        basePayload.status = lead.status;
      }
      return basePayload as LeadUpdateRequest;
    }
  };

  const handleSave = async (updatedLead: KommoLead) => {
    if (!id) return;
    try {
      setSaveSuccess(false);
      
      // Si es un nuevo lead, crearlo; si no, actualizarlo
      if (id === 'new') {
        // Construir payload para creación
        const payload = buildLeadPayload(updatedLead, true) as LeadCreateRequest;
        console.log('Creando lead con payload:', payload);
        const newLead = await crmService.createLead(payload);
        
        // Recargar el lead completo para obtener el contacto vinculado
        const leadWithContact = await crmService.getLead(newLead.id);
        
        // Guardar información del contacto para mostrarlo en el mensaje
        if (leadWithContact.contact) {
          setCreatedContact(leadWithContact.contact);
        }
        
        // Mostrar mensaje de éxito con información del contacto
        setSaveSuccess(true);
        
        // Esperar un momento para que el usuario vea el mensaje, luego redirigir
        setTimeout(() => {
          navigate(`/crm/leads/${newLead.id}`);
        }, 2000);
      } else {
        // Construir payload para actualización
        const payload = buildLeadPayload(updatedLead, false) as LeadUpdateRequest;
        console.log('Actualizando lead con payload:', payload);
        await crmService.updateLead(id, payload);
        // Recargar lead actualizado
        const updated = await crmService.getLead(id);
        setLead(updated);
        
        // Mostrar mensaje de éxito
        setSaveSuccess(true);
        
        // Esperar un momento y luego salir del modo edición
        setTimeout(() => {
          setSaveSuccess(false);
          setEditing(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error saving lead:', err);
      setSaveSuccess(false);
      
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      
      // Log detallado para diagnosticar error 422
      if (err?.response?.status === 422) {
        console.error('Error 422 - Detalles:', err.response?.data);
        alert(`Error de validación: ${JSON.stringify(err.response?.data, null, 2)}`);
      } else {
        alert(id === 'new' ? 'Error al crear el lead' : 'Error al actualizar el lead');
      }
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleQuickTask = (type: 'first_call' | 'follow_up' | 'note_sale') => {
    setQuickTaskType(type);
    setShowTaskForm(true);
    setShowNewTaskMenu(false);
  };

  const getQuickTaskConfig = (type: 'first_call' | 'follow_up' | 'note_sale') => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const configs = {
      first_call: {
        text: 'Primera llamada al cliente',
        task_type: 'call',
        complete_till: tomorrow.toISOString(),
      },
      follow_up: {
        text: 'Seguimiento con el cliente',
        task_type: 'follow_up',
        complete_till: tomorrow.toISOString(),
      },
      note_sale: {
        text: 'Anotar venta - Registrar información de la venta',
        task_type: 'deadline',
        complete_till: now.toISOString(),
      },
    };

    return configs[type];
  };

  const handleTaskSubmit = async (taskData: TaskCreateRequest) => {
    if (!id) return;
    
    try {
      // Si es una tarea rápida, usar la configuración predefinida
      if (quickTaskType) {
        const config = getQuickTaskConfig(quickTaskType);
        taskData = {
          ...taskData,
          text: config.text,
          task_type: config.task_type,
          complete_till: config.complete_till,
        };
      }

      // Asegurar que entity_id sea el ID del lead
      const finalTaskData: TaskCreateRequest = {
        ...taskData,
        entity_type: 'leads',
        entity_id: id,
      };

      await crmService.createTask(finalTaskData);
      await loadLeadData(); // Recargar datos
      setShowTaskForm(false);
      setQuickTaskType(null);
      setActiveTab('tasks'); // Cambiar a la pestaña de tareas
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">Cargando lead...</div>
        </div>
      </div>
    );
  }

  // Si estamos en modo edición, mostrar formulario
  if (editing) {
    // Si no hay lead pero estamos editando, crear uno básico (para id="new")
    if (!lead && id === 'new') {
      // Este caso ya debería estar manejado en loadLeadData, pero por si acaso:
      return (
        <div className="min-h-screen bg-gray-50">
          <CRMHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center py-12">Preparando formulario...</div>
          </div>
        </div>
      );
    }
    
    // Mostrar formulario de edición
    if (!lead) {
      return (
        <div className="min-h-screen bg-gray-50">
          <CRMHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Error al cargar el lead</p>
              <Button onClick={() => navigate('/crm/leads')} className="mt-4">
                Volver a Leads
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
            >
              <ArrowLeft size={18} className="mr-2" />
              Cancelar edición
            </Button>
            
            {/* Mensaje de confirmación de guardado */}
            {saveSuccess && (
              <Card className="border-green-300 bg-green-50 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">
                        {id === 'new' ? '¡Lead creado exitosamente!' : '¡Lead actualizado exitosamente!'}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {id === 'new' 
                          ? 'El Lead ha sido creado y vinculado a un Contacto. Redirigiendo...' 
                          : 'Los cambios se han guardado correctamente.'}
                      </p>
                      {id === 'new' && createdContact && (
                        <p className="text-xs text-green-600 mt-2">
                          Contacto vinculado: <span className="font-medium">
                            {createdContact.name || 
                             `${createdContact.first_name || ''} ${createdContact.last_name || ''}`.trim() || 
                             'Contacto creado automáticamente'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <LeadForm
              lead={lead}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  // TypeScript assertion: después de la verificación anterior, lead no puede ser null
  const currentLead: KommoLead = lead!;

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/crm/leads')}
              >
                <ArrowLeft size={18} className="mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentLead.name}</h1>
                <p className="text-gray-600 mt-1">ID: {currentLead.id}</p>
              </div>
            </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setEditing(true)}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Edit size={18} className="mr-2" />
            Editar
          </Button>
          
          {/* Botón Nuevo con menú desplegable */}
          <div className="relative">
            <Button
              onClick={() => setShowNewTaskMenu(!showNewTaskMenu)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus size={18} className="mr-2" />
              Nuevo
              <ChevronDown size={16} className="ml-2" />
            </Button>
            
            {showNewTaskMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowNewTaskMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-2">
                    <button
                      onClick={() => handleQuickTask('first_call')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <PhoneCall size={20} className="text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Primera Llamada</div>
                        <div className="text-sm text-gray-500">Crear tarea de primera llamada</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleQuickTask('follow_up')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <RefreshCw size={20} className="text-green-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Seguimiento</div>
                        <div className="text-sm text-gray-500">Crear tarea de seguimiento</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleQuickTask('note_sale')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <DollarSign size={20} className="text-yellow-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Anotar Venta</div>
                        <div className="text-sm text-gray-500">Registrar información de venta</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-200 my-1" />
                    
                    <button
                      onClick={() => {
                        setQuickTaskType(null);
                        setShowTaskForm(true);
                        setShowNewTaskMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Plus size={20} className="text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Tarea Personalizada</div>
                        <div className="text-sm text-gray-500">Crear tarea con opciones avanzadas</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentLead.price > 0 ? formatPrice(currentLead.price, currentLead.currency) : 'Sin valor'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {currentLead.status}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Fecha de Creación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-900">
              {new Date(currentLead.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="tasks">Tareas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="calls">Llamadas ({calls.length})</TabsTrigger>
          <TabsTrigger value="notes">Notas ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLead.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-gray-700">{currentLead.description}</p>
                </div>
              )}

              {currentLead.service_type && (
                <div>
                  <h3 className="font-semibold mb-2">Tipo de Servicio</h3>
                  <p className="text-gray-700">{currentLead.service_type}</p>
                </div>
              )}

              {currentLead.service_description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción del Servicio</h3>
                  <p className="text-gray-700">{currentLead.service_description}</p>
                </div>
              )}

              {currentLead.source && (
                <div>
                  <h3 className="font-semibold mb-2">Fuente</h3>
                  <p className="text-gray-700">{currentLead.source}</p>
                </div>
              )}

              {currentLead.expected_close_date && (
                <div>
                  <h3 className="font-semibold mb-2">Fecha Esperada de Cierre</h3>
                  <p className="text-gray-700">
                    {new Date(currentLead.expected_close_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}

              {currentLead.contact && (
                <div>
                  <h3 className="font-semibold mb-2">Contacto Asociado</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={18} />
                    <span>{currentLead.contact.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{task.text}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Tipo: {task.task_type} | 
                            {task.complete_till && (
                              <span className="ml-2">
                                Vence: {new Date(task.complete_till).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.is_completed ? 'Completada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay tareas asociadas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Llamadas</CardTitle>
            </CardHeader>
            <CardContent>
              {calls.length > 0 ? (
                <div className="space-y-3">
                  {calls.map(call => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Phone size={18} />
                            {call.direction === 'inbound' ? 'Llamada Entrante' : 'Llamada Saliente'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {call.phone} | Duración: {call.duration ? `${Math.floor(call.duration / 60)} min` : 'N/A'}
                          </p>
                          {call.resumen_llamada && (
                            <p className="text-sm text-gray-700 mt-2">{call.resumen_llamada}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {call.call_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(call.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay llamadas registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <p className="text-gray-700">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay notas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Formulario de Tarea */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {quickTaskType === 'first_call' && 'Nueva Primera Llamada'}
                  {quickTaskType === 'follow_up' && 'Nuevo Seguimiento'}
                  {quickTaskType === 'note_sale' && 'Anotar Venta'}
                  {!quickTaskType && 'Nueva Tarea'}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskForm(false);
                    setQuickTaskType(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <TaskForm
                defaultEntityType="lead"
                defaultEntityId={id ? (typeof id === 'string' ? parseInt(id) : id) : undefined}
                defaultText={quickTaskType ? getQuickTaskConfig(quickTaskType).text : undefined}
                defaultTaskType={quickTaskType ? getQuickTaskConfig(quickTaskType).task_type : undefined}
                defaultCompleteTill={quickTaskType ? getQuickTaskConfig(quickTaskType).complete_till : undefined}
                onSubmit={handleTaskSubmit}
                onCancel={() => {
                  setShowTaskForm(false);
                  setQuickTaskType(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}


