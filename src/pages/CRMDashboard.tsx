// CRM Dashboard - Vista principal del CRM

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { DashboardStats, KommoLead, Task } from '@/types/crm';
import {
  Users,
  TrendingUp,
  CheckSquare,
  DollarSign,
  Phone,
  Calendar,
  Activity,
  LogOut,
  BarChart3,
} from 'lucide-react';

export function CRMDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<KommoLead[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar estadísticas
      const statsData = await crmService.getDashboardStats();
      setStats(statsData);

      // Cargar leads recientes (últimos 5)
      const leadsResponse = await crmService.getLeads({
        page: 1,
        limit: 5,
      });
      setRecentLeads(leadsResponse._embedded.leads);

      // Cargar tareas pendientes
      const tasksResponse = await crmService.getTasks({
        is_completed: false,
        page: 1,
        limit: 5,
      });
      setPendingTasks(tasksResponse._embedded.tasks);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar el dashboard. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
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
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard CRM</h1>
            <p className="text-gray-600 mt-1">Gestión de Leads y Clientes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/admin/crm/leads')}
              variant="default"
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Users size={18} />
              Ver Leads
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Salir
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button
                onClick={loadDashboardData}
                variant="outline"
                className="mt-4"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Leads */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.total_leads || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Value */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Pipeline</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats?.total_pipeline_value || 0)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tareas Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.pending_tasks || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <CheckSquare className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actividad Hoy</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {recentLeads.length}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Activity className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads por Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Leads por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.leads_by_status.map((status, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {status.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {status.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.total_leads
                              ? (status.count / stats.total_leads) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!stats?.leads_by_status || stats.leads_by_status.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    No hay datos disponibles
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Leads Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">
                        {lead.service_type || 'Sin servicio'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(lead.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentLeads.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No hay leads recientes
                  </p>
                )}
              </div>
              <Button
                onClick={() => navigate('/admin/crm/leads')}
                variant="outline"
                className="w-full mt-4"
              >
                Ver todos los leads
              </Button>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Tareas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.text}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {task.task_type} • {task.entity_type} #{task.entity_id}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600">
                        Vence: {formatDate(task.due_date)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await crmService.completeTask(task.id);
                            loadDashboardData();
                          } catch (err) {
                            console.error('Error completing task:', err);
                          }
                        }}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 mt-1"
                      >
                        Completar
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    ¡No tienes tareas pendientes! 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/admin/crm/leads/new')}
                variant="outline"
                className="flex items-center justify-center gap-2 py-6"
              >
                <Users size={20} />
                Nuevo Lead
              </Button>
              <Button
                onClick={() => navigate('/admin/crm/contacts')}
                variant="outline"
                className="flex items-center justify-center gap-2 py-6"
              >
                <Phone size={20} />
                Ver Contactos
              </Button>
              <Button
                onClick={() => navigate('/admin/crm/tasks')}
                variant="outline"
                className="flex items-center justify-center gap-2 py-6"
              >
                <CheckSquare size={20} />
                Ver Tareas
              </Button>
              <Button
                onClick={() => navigate('/admin/dashboard')}
                variant="outline"
                className="flex items-center justify-center gap-2 py-6"
              >
                <Activity size={20} />
                Admin Original
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

