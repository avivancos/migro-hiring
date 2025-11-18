// CRM Dashboard - Dashboard completo basado en Kommo con datos mock

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoLead, PipelineStatus, DashboardStats } from '@/types/crm';
import {
  Users,
  LogOut,
  TrendingUp,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Building2,
  Search,
  Filter,
  Plus,
  BarChart3,
  Activity,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

// Datos mock completos
const mockStats: DashboardStats = {
  total_leads: 24,
  leads_by_status: [
    { name: 'Nuevos', count: 8 },
    { name: 'En Proceso', count: 12 },
    { name: 'Cerrados', count: 4 },
  ],
  pending_tasks: 15,
  total_pipeline_value: 12500,
};

const mockPipelineStages: PipelineStatus[] = [
  { id: '1', name: 'Nuevos', sort: 1, is_editable: true, pipeline_id: '1', color: '#3b82f6', type: 0, created_at: '', updated_at: '' },
  { id: '2', name: 'Calificación', sort: 2, is_editable: true, pipeline_id: '1', color: '#8b5cf6', type: 0, created_at: '', updated_at: '' },
  { id: '3', name: 'Propuesta', sort: 3, is_editable: true, pipeline_id: '1', color: '#f59e0b', type: 0, created_at: '', updated_at: '' },
  { id: '4', name: 'Negociación', sort: 4, is_editable: true, pipeline_id: '1', color: '#ef4444', type: 0, created_at: '', updated_at: '' },
  { id: '5', name: 'Cerrado', sort: 5, is_editable: true, pipeline_id: '1', color: '#10b981', type: 1, created_at: '', updated_at: '' },
];

const mockLeads: KommoLead[] = [
  {
    id: '1',
    name: 'Residencia Legal - Juan Pérez',
    price: 400,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'new',
    status_id: '1',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
    service_type: 'Residencia Legal',
    priority: 'high',
    source: 'Web',
    description: 'Cliente interesado en residencia legal para trabajo',
    contact: {
      id: '1',
      name: 'Juan Pérez',
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+34 600 123 456',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
  {
    id: '2',
    name: 'Nacionalidad Española - María García',
    price: 600,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'contacted',
    status_id: '2',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    is_deleted: false,
    service_type: 'Nacionalidad',
    priority: 'medium',
    source: 'Referido',
    description: 'Proceso de nacionalidad en curso, documentos pendientes',
    contact: {
      id: '2',
      name: 'María García',
      first_name: 'María',
      last_name: 'García',
      email: 'maria.garcia@email.com',
      phone: '+34 600 234 567',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
  {
    id: '3',
    name: 'Visado de Trabajo - Carlos López',
    price: 350,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'new',
    status_id: '1',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    is_deleted: false,
    service_type: 'Visado',
    priority: 'urgent',
    source: 'Llamada Fría',
    description: 'Urgente - necesita visado para trabajo en 2 semanas',
    contact: {
      id: '3',
      name: 'Carlos López',
      first_name: 'Carlos',
      last_name: 'López',
      email: 'carlos.lopez@email.com',
      phone: '+34 600 345 678',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
  {
    id: '4',
    name: 'Reagrupación Familiar - Ana Martínez',
    price: 500,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'proposal',
    status_id: '3',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    is_deleted: false,
    service_type: 'Reagrupación',
    priority: 'high',
    source: 'Web',
    description: 'Reagrupación familiar con cónyuge',
    contact: {
      id: '4',
      name: 'Ana Martínez',
      first_name: 'Ana',
      last_name: 'Martínez',
      email: 'ana.martinez@email.com',
      phone: '+34 600 456 789',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
  {
    id: '5',
    name: 'Autorización de Residencia - Luis Fernández',
    price: 450,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'negotiation',
    status_id: '4',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    is_deleted: false,
    service_type: 'Autorización',
    priority: 'medium',
    source: 'Referido',
    description: 'Renovación de autorización de residencia',
    contact: {
      id: '5',
      name: 'Luis Fernández',
      first_name: 'Luis',
      last_name: 'Fernández',
      email: 'luis.fernandez@email.com',
      phone: '+34 600 567 890',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
  {
    id: '6',
    name: 'Nacionalidad por Residencia - Carmen Ruiz',
    price: 650,
    currency: 'EUR',
    responsible_user_id: '1',
    status: 'won',
    status_id: '5',
    pipeline_id: '1',
    created_by: '1',
    updated_by: '1',
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    is_deleted: false,
    service_type: 'Nacionalidad',
    priority: 'low',
    source: 'Web',
    description: 'Nacionalidad por residencia - proceso completado',
    contact: {
      id: '6',
      name: 'Carmen Ruiz',
      first_name: 'Carmen',
      last_name: 'Ruiz',
      email: 'carmen.ruiz@email.com',
      phone: '+34 600 678 901',
      created_by: '1',
      updated_by: '1',
      created_at: '',
      updated_at: '',
      is_deleted: false,
    },
  },
];

export function CRMDashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [stages, setStages] = useState<PipelineStatus[]>([]);
  // const [pipelines, setPipelines] = useState<Pipeline[]>([]); // No usado actualmente
  const user = adminService.getUser();

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [leadsResponse, pipelinesData] = await Promise.all([
        crmService.getLeads({ limit: 100 }),
        crmService.getPipelines(),
      ]);

      setLeads(leadsResponse.items || []);
      // setPipelines(pipelinesData); // Usado solo para obtener el pipeline principal

      // Obtener stages del pipeline principal
      if (pipelinesData.length > 0) {
        const mainPipeline = pipelinesData.find(p => p.is_main) || pipelinesData[0];
        try {
          const stagesData = await crmService.getPipelineStages(mainPipeline.id);
          setStages(stagesData);
        } catch (err) {
          console.error('Error loading stages:', err);
          // Usar stages mock si falla
          setStages(mockPipelineStages);
        }
      }

      // Calcular estadísticas
      const totalLeads = leadsResponse.items?.length || 0;
      const totalPipelineValue = leadsResponse.items?.reduce((sum, lead) => sum + (lead.price || 0), 0) || 0;
      
      // Contar por status
      const leadsByStatus = leadsResponse.items?.reduce((acc, lead) => {
        const status = lead.status || 'new';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setStats({
        total_leads: totalLeads,
        leads_by_status: Object.entries(leadsByStatus).map(([name, count]) => ({
          name,
          count,
        })),
        pending_tasks: 0, // Se calculará después
        total_pipeline_value: totalPipelineValue,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // En caso de error, usar datos mock
      setLeads(mockLeads);
      setStats(mockStats);
      setStages(mockPipelineStages);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = selectedStage === null || lead.status === selectedStage || lead.status_id === selectedStage;
    
    return matchesSearch && matchesStage;
  });

  // Agrupar leads por stage (usando status en lugar de status_id)
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(lead => 
      lead.status === stage.name?.toLowerCase() || 
      lead.status_id === stage.id ||
      String(lead.status_id) === String(stage.id)
    );
    return acc;
  }, {} as Record<string | number, KommoLead[]>);

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
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-3 h-3" />;
      case 'high':
        return <Activity className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del CRM...</p>
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
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">CRM Migro</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total_leads}</div>
              <p className="text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-600" />
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Pipeline</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_pipeline_value)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-600" />
                +8% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tareas Pendientes</CardTitle>
              <Clock className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</div>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tasa de Cierre</CardTitle>
              <Target className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">67%</div>
              <p className="text-xs text-gray-500 mt-1">
                <BarChart3 className="w-3 h-3 inline mr-1 text-green-600" />
                +5% vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar leads por nombre, servicio o contacto..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStage === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStage(null)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Todos
                </Button>
                {stages.slice(0, 3).map((stage) => (
                  <Button
                    key={stage.id}
                    variant={selectedStage === stage.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStage(stage.id)}
                    style={
                      selectedStage === stage.id
                        ? { borderTopColor: stage.color, borderTopWidth: '3px' }
                        : {}
                    }
                  >
                    {stage.name}
                  </Button>
                ))}
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Lead
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Kanban */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>{filteredLeads.length} leads</span>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageLeads = leadsByStage[stage.id] || [];
              const stageTotal = stageLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

              return (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  <Card className="h-full">
                    <CardHeader
                      className="pb-3"
                      style={{ borderTopColor: stage.color, borderTopWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {stage.name}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({stageLeads.length})
                          </span>
                        </CardTitle>
                      </div>
                      {stageTotal > 0 && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {formatCurrency(stageTotal)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-green-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                              {lead.name}
                            </h4>
                            {lead.priority && lead.priority !== 'medium' && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getPriorityColor(
                                  lead.priority
                                )}`}
                              >
                                {getPriorityIcon(lead.priority)}
                                {lead.priority}
                              </span>
                            )}
                          </div>

                          {lead.contact && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <Users className="w-3 h-3" />
                              <span>
                                {lead.contact.first_name} {lead.contact.last_name}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5 text-xs text-gray-600">
                            {lead.price && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(lead.price)}
                                </span>
                              </div>
                            )}

                            {lead.service_type && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                <span>{lead.service_type}</span>
                              </div>
                            )}

                            {lead.contact?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{lead.contact.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(lead.created_at)}</span>
                            </div>
                          </div>

                          {lead.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {lead.description}
                            </p>
                          )}
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p>No hay leads en esta etapa</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones Prioritarias - Nueva Sección */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-xl font-bold text-red-900">Acciones Urgentes</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/actions')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-4">
                Tareas y acciones que requieren atención inmediata para cerrar ventas y avanzar expedientes
              </p>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/crm/actions?filter=urgent')}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Ver Acciones Urgentes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-xl font-bold text-purple-900">Expedientes Legales</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/crm/expedientes')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-4">
                Gestiona el estado y seguimiento de todos los expedientes legales en proceso
              </p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/crm/expedientes')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Expedientes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leads Recientes - Lista */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Leads Recientes</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/crm/leads')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLeads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      {lead.priority && lead.priority !== 'medium' && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                            lead.priority
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      )}
                      {(lead.status_id === '5' || lead.status === 'won') && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {lead.contact && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {lead.contact.first_name} {lead.contact.last_name}
                          </span>
                        </div>
                      )}
                      {lead.service_type && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{lead.service_type}</span>
                        </div>
                      )}
                      {lead.contact?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{lead.contact.phone}</span>
                        </div>
                      )}
                      {lead.contact?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{lead.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(lead.price)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(lead.created_at)}</p>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron leads</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

