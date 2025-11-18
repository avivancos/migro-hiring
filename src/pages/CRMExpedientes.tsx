// CRMExpedientes - Vista de expedientes legales por lead/contacto

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';
import type { KommoLead, KommoContact, Task, Call, Note } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface ExpedienteData {
  lead: KommoLead;
  contact?: KommoContact;
  tasks: Task[];
  calls: Call[];
  notes: Note[];
  status: 'nuevo' | 'en_proceso' | 'documentacion' | 'presentado' | 'resuelto' | 'cerrado';
  nextAction?: Task;
  lastUpdate: string;
}

export function CRMExpedientes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expedientes, setExpedientes] = useState<ExpedienteData[]>([]);
  const [filteredExpedientes, setFilteredExpedientes] = useState<ExpedienteData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    loadExpedientes();
  }, []);

  useEffect(() => {
    filterExpedientes();
  }, [searchTerm, statusFilter, expedientes]);

  const loadExpedientes = async () => {
    setLoading(true);
    try {
      const leadsResponse = await crmService.getLeads({ limit: 100 });
      const expedientesData: ExpedienteData[] = [];

      for (const lead of leadsResponse.items) {
        if (lead.status === 'lost') continue; // Excluir leads perdidos

        const [tasks, calls, notes] = await Promise.all([
          crmService.getContactTasks(lead.id, { entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
          crmService.getContactCalls(lead.id, { entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
          crmService.getContactNotes(lead.id, { entity_type: 'leads', limit: 50 }).catch(() => ({ items: [] })),
        ]);

        // Determinar estado del expediente
        const pendingTasks = tasks.items.filter((t: Task) => !t.is_completed);
        const nextAction = pendingTasks.sort((a: Task, b: Task) => {
          if (!a.complete_till) return 1;
          if (!b.complete_till) return -1;
          return new Date(a.complete_till).getTime() - new Date(b.complete_till).getTime();
        })[0];

        let status: ExpedienteData['status'] = 'nuevo';
        if (lead.status === 'won') {
          status = 'resuelto';
        } else if (lead.status === 'negotiation' || lead.status === 'proposal') {
          status = 'presentado';
        } else if (lead.status === 'contacted') {
          status = 'documentacion';
        } else if (lead.status === 'new') {
          status = 'nuevo';
        }

        expedientesData.push({
          lead,
          contact: lead.contact,
          tasks: tasks.items,
          calls: calls.items,
          notes: notes.items,
          status,
          nextAction,
          lastUpdate: lead.updated_at,
        });
      }

      setExpedientes(expedientesData);
    } catch (err) {
      console.error('Error loading expedientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterExpedientes = () => {
    let filtered = expedientes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.lead.name?.toLowerCase().includes(term) ||
        e.contact?.name?.toLowerCase().includes(term) ||
        e.lead.service_type?.toLowerCase().includes(term)
      );
    }

    setFilteredExpedientes(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'bg-blue-100 text-blue-800';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'documentacion':
        return 'bg-orange-100 text-orange-800';
      case 'presentado':
        return 'bg-purple-100 text-purple-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'cerrado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nuevo: 'Nuevo',
      en_proceso: 'En Proceso',
      documentacion: 'Documentación',
      presentado: 'Presentado',
      resuelto: 'Resuelto',
      cerrado: 'Cerrado',
    };
    return labels[status] || status;
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
        <div className="text-center py-12">Cargando expedientes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expedientes Legales</h1>
          <p className="text-gray-600 mt-1">Gestiona los expedientes legales de tus clientes</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por nombre, contacto o tipo de servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos los estados</option>
                <option value="nuevo">Nuevo</option>
                <option value="en_proceso">En Proceso</option>
                <option value="documentacion">Documentación</option>
                <option value="presentado">Presentado</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['nuevo', 'documentacion', 'presentado', 'en_proceso', 'resuelto'].map((status) => {
          const count = expedientes.filter(e => e.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{getStatusLabel(status)}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lista de Expedientes */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExpedientes.map((expediente) => (
          <Card
            key={expediente.lead.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/crm/leads/${expediente.lead.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="text-purple-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-lg">{expediente.lead.name}</h3>
                      <p className="text-sm text-gray-600">{expediente.lead.service_type}</p>
                    </div>
                    <Badge className={getStatusColor(expediente.status)}>
                      {getStatusLabel(expediente.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {expediente.contact && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={16} />
                        <span>{expediente.contact.name}</span>
                      </div>
                    )}
                    {expediente.lead.price > 0 && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <DollarSign size={16} />
                        <span>{formatPrice(expediente.lead.price, expediente.lead.currency)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>
                        {new Date(expediente.lastUpdate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>

                  {expediente.nextAction && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-yellow-600" />
                        <span className="font-semibold">Próxima acción:</span>
                        <span>{expediente.nextAction.text}</span>
                        {expediente.nextAction.complete_till && (
                          <span className="text-gray-500">
                            - {new Date(expediente.nextAction.complete_till).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-4 text-xs text-gray-500">
                    <span>{expediente.tasks.length} tareas</span>
                    <span>{expediente.calls.length} llamadas</span>
                    <span>{expediente.notes.length} notas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExpedientes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              No se encontraron expedientes
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


