// CRMLeadDetail - Detalle completo de un lead

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, User, Phone, Plus, PhoneCall, RefreshCw, DollarSign, ChevronDown, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { Lead, Task, Call, Note, TaskCreateRequest, Contact, LeadCreateRequest, LeadUpdateRequest } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { LeadForm } from '@/components/CRM/LeadForm';
import { TaskForm } from '@/components/CRM/TaskForm';
import { CallForm } from '@/components/CRM/CallForm';
import { formatLeadStatus, formatCallStatus } from '@/utils/statusTranslations';
import { usePageTitle } from '@/hooks/usePageTitle';
export function CRMLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [createdContact, setCreatedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewTaskMenu, setShowNewTaskMenu] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState<'first_call' | 'follow_up' | 'note_sale' | null>(null);
  const [validatingContact, setValidatingContact] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    missingFields: string[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadLeadData();
    }
  }, [id]);

  const loadLeadData = async () => {
    console.log('🟣 [CRMLeadDetail] loadLeadData llamado, id:', id);
    if (!id) {
      console.warn('⚠️ [CRMLeadDetail] loadLeadData: id no válido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Si es "new", usar defaults y no cargar datos relacionados
      if (id === 'new') {
        let leadDefaults: Partial<Lead> = {};
        try {
          leadDefaults = await crmService.getLeadDefaults();
        } catch (err) {
          console.warn('No se pudieron cargar los defaults del backend, usando valores por defecto:', err);
          // Continuar con valores por defecto locales
        }
        
        // Crear lead con defaults o valores por defecto
        const newLead: Lead = {
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
        } as Lead;
        
        setLead(newLead);
        // Para "new", no hay tareas, llamadas ni notas - mostrar arrays vacíos
        setTasks([]);
        setCalls([]);
        setNotes([]);
        // Activar modo de edición automáticamente para nuevo lead
        setEditing(true);
      } else {
        // Lead existente: cargar todo, pero manejar errores
        // Nota: Los leads ahora están unificados con contactos, usar getContact
        console.log('🟣 [CRMLeadDetail] Cargando datos del lead existente (como contacto)...');
        const [leadData, tasksData, callsData, notesData] = await Promise.all([
          crmService.getContact(id).catch((err) => {
            console.error('❌ [CRMLeadDetail] Error loading contact (lead unificado):', err);
            // Si falla con getContact, intentar con getLead como fallback
            return crmService.getLead(id).catch((fallbackErr) => {
              console.error('❌ [CRMLeadDetail] Error loading lead (fallback):', fallbackErr);
              throw fallbackErr; // Re-lanzar para mostrar error
            });
          }),
          // Para tareas, llamadas y notas, usar 'contacts' porque los leads ahora son contactos unificados
          crmService.getTasks({ entity_id: id, entity_type: 'contacts', limit: 50 }).catch((err) => {
            console.warn('⚠️ [CRMLeadDetail] Error loading tasks, usando array vacío:', err);
            return { items: [] };
          }),
          crmService.getCalls({ entity_id: id, entity_type: 'contacts', limit: 50 }).catch((err) => {
            console.warn('⚠️ [CRMLeadDetail] Error loading calls, usando array vacío:', err);
            return { items: [] };
          }),
          crmService.getNotes({ entity_id: id, entity_type: 'contacts', limit: 50 }).catch((err) => {
            console.warn('⚠️ [CRMLeadDetail] Error loading notes, usando array vacío:', err);
            return { items: [] };
          }),
        ]);
        
        console.log('🟣 [CRMLeadDetail] Datos cargados:');
        console.log('  - Lead:', leadData?.id, leadData?.name);
        console.log('  - Tasks:', tasksData?.items?.length || 0, tasksData);
        console.log('  - Calls (raw):', callsData);
        console.log('  - Calls items:', callsData?.items);
        console.log('  - Calls items length:', callsData?.items?.length || 0);
        console.log('  - Calls es array?:', Array.isArray(callsData));
        console.log('  - Notes:', notesData?.items?.length || 0);
        
        // Normalizar callsData si viene en formato inesperado
        let normalizedCalls: Call[] = [];
        if (Array.isArray(callsData)) {
          console.warn('⚠️ [CRMLeadDetail] callsData es un array directo, normalizando...');
          normalizedCalls = callsData;
        } else if (callsData?.items && Array.isArray(callsData.items)) {
          normalizedCalls = callsData.items;
        } else {
          console.warn('⚠️ [CRMLeadDetail] callsData no tiene estructura esperada, usando array vacío');
          normalizedCalls = [];
        }
        
        // leadData puede ser Lead o Contact, pero setLead espera Lead | null
        // Si es Contact, no podemos asignarlo directamente
        if (leadData && 'price' in leadData && 'pipeline_id' in leadData) {
          setLead(leadData as Lead);
        } else {
          // Si es un contacto, no podemos usarlo como lead
          console.warn('⚠️ [CRMLeadDetail] leadData es un Contact, no se puede usar como lead');
          setLead(null);
        }
        setTasks(tasksData?.items || []);
        
        // Ordenar llamadas de más recientes a más antiguas
        const sortedCalls = normalizedCalls.sort((a, b) => {
          const dateA = new Date(a.started_at || a.created_at).getTime();
          const dateB = new Date(b.started_at || b.created_at).getTime();
          return dateB - dateA; // Descendente (más recientes primero)
        });
        setCalls(sortedCalls);
        
        setNotes(notesData?.items || []);
        
        console.log('✅ [CRMLeadDetail] Estados actualizados con nuevos datos');
      }
    } catch (err: any) {
      console.error('❌ [CRMLeadDetail] Error loading lead data:', err);
      const errorMessage = err?.response?.status === 404 
        ? 'Contacto no encontrado'
        : err?.response?.data?.detail || err?.message || 'Error al cargar el contacto';
      setError(errorMessage);
      setLead(null);
    } finally {
      setLoading(false);
      console.log('🟣 [CRMLeadDetail] loadLeadData finalizado');
    }
  };

  // Función para validar UUID
  const isUUID = (v?: string | null): boolean => {
    if (!v) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  };

  // Función para construir payload sin valores inválidos
  const buildLeadPayload = (lead: Lead, isCreate: boolean = false): LeadCreateRequest | LeadUpdateRequest => {
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

  const handleSave = async (updatedLead: Lead) => {
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
        
        // Mostrar notificación si se asignó automáticamente
        if (!payload.responsible_user_id && newLead.responsible_user_id) {
          // El backend asignó automáticamente - esto se maneja en el mensaje de éxito
          console.log('Lead asignado automáticamente a:', newLead.responsible_user_id);
        }
        
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
        alert(id === 'new' ? 'Error al crear el contacto' : 'Error al actualizar el contacto');
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
    console.log('🔶 [CRMLeadDetail] handleQuickTask llamado con type:', type);
    
    // Si es 'first_call', abrir formulario de llamada en lugar de tarea
    if (type === 'first_call') {
      console.log('🔶 [CRMLeadDetail] first_call detectado - abriendo CallForm');
      setShowCallForm(true);
      setShowTaskForm(false);
      setShowNewTaskMenu(false);
      setQuickTaskType(null);
      return;
    }
    
    // Para otros tipos, crear tarea normalmente
    console.log('🔶 [CRMLeadDetail] Creando tarea de tipo:', type);
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

      // Los leads ahora son contactos unificados, usar 'contacts' como entity_type
      const finalTaskData: TaskCreateRequest = {
        ...taskData,
        entity_type: 'contacts',
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

  const handleCallSubmit = async (callData: any) => {
    console.log('🔵 [CRMLeadDetail] handleCallSubmit llamado');
    console.log('🔵 [CRMLeadDetail] id:', id);
    console.log('🔵 [CRMLeadDetail] callData recibido:', callData);
    
    if (!id || id === 'new') {
      console.warn('⚠️ [CRMLeadDetail] No se puede guardar llamada: id inválido', id);
      return;
    }
    
    try {
      // Los leads ahora son contactos unificados, usar 'contacts' como entity_type
      const finalCallData = {
        ...callData,
        entity_type: 'contacts' as const,
        entity_id: id,
      };

      console.log('🔵 [CRMLeadDetail] finalCallData preparado:', finalCallData);
      console.log('🔵 [CRMLeadDetail] Llamando a crmService.createCall...');
      
      const createdCall = await crmService.createCall(finalCallData);
      
      console.log('✅ [CRMLeadDetail] Llamada creada exitosamente:', createdCall);
      console.log('🔵 [CRMLeadDetail] Recargando datos del lead...');
      
      await loadLeadData(); // Recargar datos para mostrar la nueva llamada
      
      console.log('✅ [CRMLeadDetail] Datos recargados. Cerrando modal y cambiando pestaña...');
      setShowCallForm(false);
      setActiveTab('calls'); // Cambiar a la pestaña de llamadas
      
      console.log('✅ [CRMLeadDetail] handleCallSubmit completado exitosamente');
    } catch (err: any) {
      console.error('❌ [CRMLeadDetail] Error creating call:', err);
      console.error('❌ [CRMLeadDetail] Error details:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        stack: err?.stack,
      });
      
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      alert('Error al registrar la llamada');
      throw err; // Re-lanzar para que CallForm maneje el error
    }
  };

  const handleMarkAsContacted = async () => {
    if (!id || id === 'new') return;
    
    setValidatingContact(true);
    setValidationResult(null);
    
    try {
      const result = await crmService.markLeadAsContacted(id);
      
      setValidationResult({
        success: result.success,
        message: result.message,
        missingFields: result.missing_fields || [],
      });
      
      if (result.success) {
        // Recargar el lead para obtener el estado actualizado
        await loadLeadData();
      }
    } catch (err: any) {
      console.error('Error al marcar contacto como contactado:', err);
      setValidationResult({
        success: false,
        message: err?.response?.data?.message || 'Error al validar el contacto inicial',
        missingFields: err?.response?.data?.missing_fields || [],
      });
    } finally {
      setValidatingContact(false);
    }
  };

  // La autenticación se maneja con ProtectedRoute en App.tsx

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">Cargando lead...</div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error || (!loading && !lead && id !== 'new')) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-red-900 mb-2">
                  Error al cargar el lead
                </h2>
                <p className="text-red-700 mb-4">
                  {error || 'El lead no se pudo cargar. Puede que no exista o que haya un problema de conexión.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/crm/leads')}
                  >
                    Volver a Leads
                  </Button>
                  <Button
                    onClick={() => {
                      setError(null);
                      loadLeadData();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  // Si estamos en modo edición, mostrar formulario
  if (editing) {
    // Si no hay lead pero estamos editando, crear uno básico (para id="new")
    if (!lead && id === 'new') {
      // Este caso ya debería estar manejado en loadLeadData, pero por si acaso:
      return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">Preparando formulario...</div>
        </div>
      );
    }
    
    // Mostrar formulario de edición
  if (!lead) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Error al cargar el contacto</p>
          <Button onClick={() => navigate('/crm/leads')} className="mt-4">
            Volver a Contactos
          </Button>
        </div>
      </div>
    );
  }
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
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
                        {id === 'new' ? '¡Contacto creado exitosamente!' : '¡Contacto actualizado exitosamente!'}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {id === 'new' 
                          ? 'El Contacto ha sido creado correctamente. Redirigiendo...' 
                          : 'Los cambios se han guardado correctamente.'}
                      </p>
                      {id === 'new' && createdContact && (
                        <p className="text-xs text-green-600 mt-2">
                          Contacto: <span className="font-medium">
                            {createdContact.name || 
                             `${createdContact.first_name || ''} ${createdContact.last_name || ''}`.trim() || 
                             'Contacto creado automáticamente'}
                          </span>
                        </p>
                      )}
                      {id === 'new' && lead && lead.responsible_user_id && (
                        <p className="text-xs text-blue-600 mt-2">
                          ℹ️ El contacto ha sido asignado automáticamente a un agente. 
                          El agente recibirá una notificación por email.
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
    );
  }

  // TypeScript assertion: después de la verificación anterior, lead no puede ser null
  const currentLead: Lead = lead!;

  // Actualizar título de la página con el nombre del lead
  const leadName = currentLead?.name || 'Lead';
  usePageTitle(`${leadName} - Detalle de Lead | Migro.es`);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
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
                        <div className="font-semibold text-gray-900">Registrar Primera Llamada</div>
                        <div className="text-sm text-gray-500">Abrir formulario de llamada</div>
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
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {formatLeadStatus(currentLead.status)}
              </span>
              {currentLead.initial_contact_completed ? (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">Contactado inicialmente</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-700">Pendiente de contacto inicial</span>
                </div>
              )}
            </div>
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
          <TabsTrigger value="calls" data-tab="calls">Llamadas ({calls.length})</TabsTrigger>
          <TabsTrigger value="notes">Notas ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Validación de Primera Llamada */}
          {!currentLead.initial_contact_completed && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Validación de Primera Llamada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Este contacto aún no ha sido marcado como contactado inicialmente. 
                  Asegúrate de que la primera llamada tenga todos los datos requeridos antes de marcarlo.
                </p>
                
                {/* Botón para registrar primera llamada */}
                <Button
                  onClick={() => {
                    console.log('🟢 [CRMLeadDetail] Botón "Registrar Primera Llamada" clickeado');
                    setShowCallForm(true);
                    setShowTaskForm(false);
                    setQuickTaskType(null);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Registrar Primera Llamada
                </Button>
                
                {/* Botón para validar */}
                <Button
                  onClick={handleMarkAsContacted}
                  disabled={validatingContact}
                  variant="outline"
                  className="w-full"
                >
                  {validatingContact ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Contactado Inicialmente
                    </>
                  )}
                </Button>
                
                {/* Resultado de validación */}
                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {validationResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${
                          validationResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {validationResult.message}
                        </p>
                        
                        {validationResult.missingFields.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-700 mb-1">
                              Faltan los siguientes datos:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                              {validationResult.missingFields.map((field, idx) => (
                                <li key={idx}>{field}</li>
                              ))}
                            </ul>
                            <p className="text-xs text-red-600 mt-2">
                              📧 Se ha enviado un email al agente responsable con esta información.
                            </p>
                          </div>
                        )}
                        
                        {validationResult.success && (
                          <p className="text-sm text-green-700 mt-2">
                            📧 Se ha enviado un email de notificación al responsable del lead.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Contacto</CardTitle>
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
                  {!currentLead.contact.city && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Falta la ciudad del contacto (requerido para validación)
                    </p>
                  )}
                  {!currentLead.contact.nacionalidad && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Falta la nacionalidad del contacto (requerido para validación)
                    </p>
                  )}
                  {!currentLead.contact.email && !currentLead.contact.phone && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Falta email o teléfono del contacto (requerido para validación)
                    </p>
                  )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Llamadas</CardTitle>
              <Button
                onClick={() => {
                  console.log('🔵 [CRMLeadDetail] Botón "Registrar Llamada" en pestaña clickeado');
                  setShowCallForm(true);
                  setShowTaskForm(false);
                  setQuickTaskType(null);
                }}
                variant="outline"
                size="sm"
              >
                <Phone size={16} className="mr-2" />
                Registrar Llamada
              </Button>
            </CardHeader>
            <CardContent>
              {calls.length > 0 ? (
                <div className="space-y-3">
                  {calls.map(call => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
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
                          {!call.resumen_llamada && (
                            <p className="text-xs text-yellow-600 mt-2">
                              ⚠️ Falta el resumen de la llamada (requerido para validación)
                            </p>
                          )}
                          {!call.started_at && (
                            <p className="text-xs text-yellow-600 mt-1">
                              ⚠️ Falta la fecha de inicio (requerido para validación)
                            </p>
                          )}
                          {!call.call_status && (
                            <p className="text-xs text-yellow-600 mt-1">
                              ⚠️ Falta el estado de la llamada (requerido para validación)
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          call.call_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : call.call_status === 'no_answer'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {formatCallStatus(call.call_status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(call.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay llamadas registradas</p>
                  <p className="text-xs text-gray-400">
                    Registra la primera llamada para poder marcar el contacto como contactado inicialmente.
                  </p>
                </div>
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
                defaultEntityType="contacts"
                defaultEntityId={id || undefined}
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

      {/* Modal de Formulario de Llamada */}
      {showCallForm && id && id !== 'new' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Registrar Llamada
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCallForm(false);
                  }}
                >
                  ✕
                </Button>
              </div>
              <CallForm
                defaultEntityType="contacts"
                defaultEntityId={id}
                defaultPhone={lead?.contact?.phone || lead?.contact?.mobile || ''}
                onSubmit={handleCallSubmit}
                onCancel={() => {
                  setShowCallForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


