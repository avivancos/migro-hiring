// CRM Leads - Lista y gestión de leads

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoLead, Pipeline, PipelineStatus, CRMUser, LeadFilters } from '@/types/crm';
import {
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  User,
  Building2,
} from 'lucide-react';

export function CRMLeads() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadInitialData();
  }, [navigate]);

  useEffect(() => {
    if (pipelines.length > 0) {
      loadLeads();
    }
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [pipelinesData, usersData] = await Promise.all([
        crmService.getPipelines(),
        crmService.getUsers(true),
      ]);
      
      setPipelines(pipelinesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await crmService.getLeads(filters);
      setLeads(response._embedded.leads);
      setPage(response._page.page);
      setTotalPages(response._page.pages || 1);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query, page: 1 });
  };

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (statusId: number): string => {
    // Puedes personalizar colores según el estado
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-green-100 text-green-800',
      'bg-red-100 text-red-800',
    ];
    return colors[statusId % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/crm')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1">
                {leads.length} leads encontrados
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              Filtros
            </Button>
            <Button
              onClick={() => navigate('/admin/crm/leads/new')}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar leads por nombre..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <Label>Pipeline</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-gray-300 p-2"
                    value={filters.pipeline_id || ''}
                    onChange={(e) => handleFilterChange('pipeline_id', e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Todos</option>
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Responsable</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-gray-300 p-2"
                    value={filters.responsible_user_id || ''}
                    onChange={(e) => handleFilterChange('responsible_user_id', e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Todos</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Prioridad</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-gray-300 p-2"
                    value={filters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  >
                    <option value="">Todas</option>
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>

                <div>
                  <Label>Fuente</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-gray-300 p-2"
                    value={filters.source || ''}
                    onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
                  >
                    <option value="">Todas</option>
                    <option value="Web">Web</option>
                    <option value="Referido">Referido</option>
                    <option value="Llamada Fría">Llamada Fría</option>
                    <option value="Evento">Evento</option>
                    <option value="Red Social">Red Social</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando leads...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card
                  key={lead.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lead.name}
                          </h3>
                          {lead.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(lead.priority)}`}>
                              {lead.priority}
                            </span>
                          )}
                          {lead.status && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lead.status_id)}`}>
                              {lead.status.name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          {lead.service_type && (
                            <div className="flex items-center gap-2">
                              <Building2 size={16} />
                              <span>{lead.service_type}</span>
                            </div>
                          )}
                          
                          {lead.contact && (
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span>{lead.contact.first_name} {lead.contact.last_name}</span>
                            </div>
                          )}
                          
                          {lead.source && (
                            <div className="flex items-center gap-2">
                              <Phone size={16} />
                              <span>{lead.source}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(lead.created_at)}</span>
                          </div>
                        </div>

                        {lead.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {lead.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(lead.price)}
                        </p>
                        {lead.responsible_user && (
                          <p className="text-sm text-gray-500 mt-1">
                            {lead.responsible_user.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {leads.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No se encontraron leads</p>
                    <Button
                      onClick={() => navigate('/admin/crm/leads/new')}
                      className="mt-4"
                    >
                      Crear primer lead
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setFilters({ ...filters, page: page - 1 })}
                  disabled={page === 1}
                  variant="outline"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  onClick={() => setFilters({ ...filters, page: page + 1 })}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

