// CRMLeadList - Lista de leads con vista Kanban drag & drop

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, List, LayoutGrid } from 'lucide-react';
import type { KommoLead, Pipeline } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { DollarSign, User, Calendar } from 'lucide-react';
import { formatLeadStatus } from '@/utils/statusTranslations';
const LEAD_STATUSES = [
  { value: 'new', label: 'Nuevos', color: 'bg-blue-100 border-blue-300' },
  { value: 'contacted', label: 'Contactados', color: 'bg-yellow-100 border-yellow-300' },
  { value: 'proposal', label: 'Propuesta', color: 'bg-purple-100 border-purple-300' },
  { value: 'negotiation', label: 'Negociación', color: 'bg-orange-100 border-orange-300' },
  { value: 'won', label: 'Ganados', color: 'bg-green-100 border-green-300' },
  { value: 'lost', label: 'Perdidos', color: 'bg-red-100 border-red-300' },
];

export function CRMLeadList() {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<KommoLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [draggedLead, setDraggedLead] = useState<KommoLead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, selectedPipeline, leads]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Usar contactos directamente ya que los leads están unificados con contactos
      const [allContacts, pipelinesData] = await Promise.all([
        crmService.getAllContacts().catch(() => []), // Cargar todos los contactos (los leads ahora son contactos)
        crmService.getPipelines().catch(() => []), // Manejar pipelines vacío
      ]);
      
      // Los contactos ahora incluyen todos los campos de leads
      // Usar contactos directamente como "leads" (son lo mismo ahora)
      setLeads(allContacts as any);
      setPipelines(Array.isArray(pipelinesData) ? pipelinesData : []);
      // Si hay pipelines, seleccionar el principal; si está vacío, no bloquear vista
      if (Array.isArray(pipelinesData) && pipelinesData.length > 0 && !selectedPipeline) {
        const mainPipeline = pipelinesData.find(p => p.is_main) || pipelinesData[0];
        if (mainPipeline) {
        setSelectedPipeline(mainPipeline.id);
        }
      }
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Filtrar por pipeline
    if (selectedPipeline) {
      filtered = filtered.filter(lead => lead.pipeline_id === selectedPipeline);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(term) ||
        lead.description?.toLowerCase().includes(term) ||
        lead.contact?.name?.toLowerCase().includes(term)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleDragStart = (lead: KommoLead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: string) => {
    if (!draggedLead || draggedLead.status === targetStatus) {
      setDraggedLead(null);
      return;
    }

    try {
      await crmService.updateLead(draggedLead.id, { status: targetStatus });
      setLeads(prev => prev.map(lead =>
        lead.id === draggedLead.id ? { ...lead, status: targetStatus } : lead
      ));
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Error al actualizar el estado del contacto');
    } finally {
      setDraggedLead(null);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter(lead => lead.status === status);
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // La autenticación se maneja con ProtectedRoute en App.tsx

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">Cargando contactos...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
        <div className="space-y-6">
          {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus oportunidades de venta</p>
        </div>
        <Button
              onClick={(e) => {
                e.preventDefault();
                console.log('Navegando a nuevo lead...');
                navigate('/crm/leads/new');
              }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar por nombre, descripción o contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos los pipelines</option>
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'kanban' ? 'default' : 'outline'}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid size={18} className="mr-2" />
                Kanban
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
              >
                <List size={18} className="mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista Kanban */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {LEAD_STATUSES.map(status => {
            const statusLeads = getLeadsByStatus(status.value);
            return (
              <Card
                key={status.value}
                className={`${status.color} min-h-[500px]`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status.value)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex justify-between items-center">
                    <span>{status.label}</span>
                    <span className="bg-white px-2 py-1 rounded-full text-xs">
                      {statusLeads.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusLeads.map(lead => (
                    <Card
                      key={lead.id}
                      className="bg-white cursor-pointer hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm flex-1">{lead.name}</h3>
                          {lead.initial_contact_completed ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 flex-shrink-0" title="Contactado inicialmente">
                              ✅
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 flex-shrink-0" title="Pendiente de contacto inicial">
                              ⏳
                            </span>
                          )}
                        </div>
                        {lead.contact && (
                          <div className="flex items-center text-xs text-gray-600">
                            <User size={14} className="mr-1" />
                            {lead.contact.name}
                          </div>
                        )}
                        {lead.price > 0 && (
                          <div className="flex items-center text-xs text-green-600 font-semibold">
                            <DollarSign size={14} className="mr-1" />
                            {formatPrice(lead.price, lead.currency)}
                          </div>
                        )}
                        {lead.closest_task_at && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={14} className="mr-1" />
                            {new Date(lead.closest_task_at).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {statusLeads.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Sin leads
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vista Lista */}
      {view === 'list' && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Nombre</th>
                    <th className="text-left p-3 font-semibold text-sm">Contacto</th>
                    <th className="text-left p-3 font-semibold text-sm">Estado</th>
                    <th className="text-left p-3 font-semibold text-sm">Valor</th>
                    <th className="text-left p-3 font-semibold text-sm">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    >
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{lead.name}</span>
                          {lead.initial_contact_completed ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800" title="Contactado inicialmente">
                              ✅
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800" title="Pendiente de contacto inicial">
                              ⏳
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{lead.contact?.name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          LEAD_STATUSES.find(s => s.value === lead.status)?.color || 'bg-gray-100'
                        }`}>
                          {LEAD_STATUSES.find(s => s.value === lead.status)?.label || formatLeadStatus(lead.status)}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-green-600">
                        {lead.price > 0 ? formatPrice(lead.price, lead.currency) : '-'}
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(lead.created_at).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No se encontraron leads
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}


