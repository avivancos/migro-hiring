// CRMLeadDetail - Detalle completo de un lead

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, DollarSign, User, Calendar, Phone, Mail, MapPin, Building } from 'lucide-react';
import type { KommoLead, Task, Call, Note } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { LeadForm } from '@/components/CRM/LeadForm';

export function CRMLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<KommoLead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState(false);

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
        <Button
          onClick={() => setEditing(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Edit size={18} className="mr-2" />
          Editar
        </Button>
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
      <Tabs defaultValue="info" className="space-y-4">
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
    </div>
  );
}


