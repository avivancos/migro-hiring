// CRM Contact Detail - Vista detallada de contacto con pestañas

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoContact, KommoLead, Task, Call, Note } from '@/types/crm';
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
  MoreVertical,
} from 'lucide-react';

export function CRMContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<KommoContact | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/contrato/login');
      return;
    }
    if (id) {
      loadContactData();
    }
  }, [id, navigate]);

  const loadContactData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [contactData, leadsData, tasksData, callsData, notesData] = await Promise.all([
        crmService.getContact(id),
        crmService.getContactLeads(id, { limit: 50 }),
        crmService.getContactTasks(id, { limit: 50 }),
        crmService.getContactCalls(id, { limit: 50 }),
        crmService.getContactNotes(id, { limit: 50 }),
      ]);
      
      setContact(contactData);
      setLeads(leadsData.items || []);
      setTasks(tasksData.items || []);
      setCalls(callsData.items || []);
      setNotes(notesData.items || []);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contacto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/crm/contacts')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                </h1>
                <p className="text-sm text-gray-500">Contacto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/crm/contacts/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Información Principal */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-600">
                    {(contact.name || contact.first_name || 'C')[0].toUpperCase()}
                    {(contact.last_name || contact.name?.split(' ')[1] || '')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                    </h2>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Phone className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {contact.grading_llamada && (
                    <span
                      className={`text-sm px-3 py-1 rounded-full border ${getGradingColor(
                        contact.grading_llamada
                      )}`}
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      Llamada: {contact.grading_llamada}
                    </span>
                  )}
                  {contact.grading_situacion && (
                    <span
                      className={`text-sm px-3 py-1 rounded-full border ${getGradingColor(
                        contact.grading_situacion
                      )}`}
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      Situación: {contact.grading_situacion}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/crm/contacts/${id}/call`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Nueva Llamada
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/crm/contacts/${id}/task`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/crm/contacts/${id}/note`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nueva Nota
                </Button>
              </div>
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
                  <Button size="sm" onClick={() => navigate(`/crm/contacts/${id}/task`)}>
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
                  <Button size="sm" onClick={() => navigate(`/crm/contacts/${id}/call`)}>
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
                        <div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {call.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                            </span>
                            <span className="text-sm text-gray-600">{call.phone_number}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(call.started_at)} • Duración: {formatDuration(call.duration)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            call.status === 'answered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {call.status}
                        </span>
                      </div>
                      {call.resumen_llamada && (
                        <p className="text-sm text-gray-700 mt-2">{call.resumen_llamada}</p>
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
                  <Button size="sm" onClick={() => navigate(`/crm/contacts/${id}/note`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
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
                <CardTitle>Historial de Actividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-center text-gray-500 py-8">
                    Timeline de actividades (próximamente)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

