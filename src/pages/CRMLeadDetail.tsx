// CRMLeadDetail - Detalle completo de un lead

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, User, Phone, Plus, PhoneCall, RefreshCw, DollarSign, ChevronDown } from 'lucide-react';
import type { KommoLead, Task, Call, Note, TaskCreateRequest } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { LeadForm } from '@/components/CRM/LeadForm';
import { TaskForm } from '@/components/CRM/TaskForm';

export function CRMLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<KommoLead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState(false);
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
      const [leadData, tasksData, callsData, notesData] = await Promise.all([
        crmService.getLead(id),
        crmService.getTasks({ entity_id: id, entity_type: 'leads', limit: 50 }),
        crmService.getCalls({ entity_id: id, entity_type: 'leads', limit: 50 }),
        crmService.getNotes({ entity_id: id, entity_type: 'leads', limit: 50 }),
      ]);
      setLead(leadData);
      setTasks(tasksData.items || []);
      setCalls(callsData.items || []);
      setNotes(notesData.items || []);
    } catch (err) {
      console.error('Error loading lead data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedLead: KommoLead) => {
    if (!id) return;
    try {
      await crmService.updateLead(id, updatedLead);
      setLead(updatedLead);
      setEditing(false);
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Error al actualizar el lead');
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
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Error al crear la tarea');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando lead...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Lead no encontrado</p>
          <Button onClick={() => navigate('/crm/leads')} className="mt-4">
            Volver a Leads
          </Button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          onClick={() => setEditing(false)}
          className="mb-4"
        >
          <ArrowLeft size={18} className="mr-2" />
          Cancelar edición
        </Button>
        <LeadForm
          lead={lead}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600 mt-1">ID: {lead.id}</p>
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
              {lead.price > 0 ? formatPrice(lead.price, lead.currency) : 'Sin valor'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {lead.status}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Fecha de Creación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-900">
              {new Date(lead.created_at).toLocaleDateString('es-ES', {
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
              {lead.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-gray-700">{lead.description}</p>
                </div>
              )}

              {lead.service_type && (
                <div>
                  <h3 className="font-semibold mb-2">Tipo de Servicio</h3>
                  <p className="text-gray-700">{lead.service_type}</p>
                </div>
              )}

              {lead.service_description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción del Servicio</h3>
                  <p className="text-gray-700">{lead.service_description}</p>
                </div>
              )}

              {lead.source && (
                <div>
                  <h3 className="font-semibold mb-2">Fuente</h3>
                  <p className="text-gray-700">{lead.source}</p>
                </div>
              )}

              {lead.expected_close_date && (
                <div>
                  <h3 className="font-semibold mb-2">Fecha Esperada de Cierre</h3>
                  <p className="text-gray-700">
                    {new Date(lead.expected_close_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}

              {lead.contact && (
                <div>
                  <h3 className="font-semibold mb-2">Contacto Asociado</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={18} />
                    <span>{lead.contact.name}</span>
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
  );
}


