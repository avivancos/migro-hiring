// Admin Dashboard - Dashboard principal del admin
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, ClockIcon, CurrencyDollarIcon, DocumentTextIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalContracts: number;
  pendingContracts: number;
  completedContracts: number;
  totalRevenue: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
            // Por ahora usamos datos mock
      const mockStats: DashboardStats = {
        totalUsers: 0,
        activeUsers: 0,
        totalContracts: 0,
        pendingContracts: 0,
        completedContracts: 0,
        totalRevenue: 0,
      };

      // Intentar cargar datos reales
      try {
        // const users = await adminService.getAllUsers();
        // const contracts = await adminService.getAllContracts();
        // ... procesar datos
      } catch (err) {
        console.warn('No se pudieron cargar estadísticas reales, usando datos mock:', err);
      }

      setStats(mockStats);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Resumen general del sistema</p>
          </div>
          <Button
            onClick={() => navigate('/admin/users/create')}
            className="flex items-center gap-2"
          >
            <UserPlusIcon width={18} height={18} />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Usuarios */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <UsersIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeUsers} activos
              </p>
            </CardContent>
          </Card>

          {/* Total Contratos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedContracts} completados
              </p>
            </CardContent>
          </Card>

          {/* Contratos Pendientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <ClockIcon className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning-dark">{stats.pendingContracts}</div>
              <p className="text-xs text-gray-500 mt-1">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          {/* Ingresos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <CurrencyDollarIcon className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-dark">
                {stats.totalRevenue.toLocaleString('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total acumulado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Administra usuarios del sistema, roles y permisos.
              </p>
              <Button
                onClick={() => navigate('/admin/users')}
                variant="outline"
                className="w-full flex items-center justify-between"
              >
                <span>Ver todos los usuarios</span>
                <ArrowRightIcon width={16} height={16} />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                Gestión de Contratos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Crea y gestiona códigos de contratación.
              </p>
              <Button
                onClick={() => navigate('/contrato/dashboard')}
                variant="outline"
                className="w-full flex items-center justify-between"
              >
                <span>Ir a contratos</span>
                <ArrowRightIcon width={16} height={16} />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-gray-600">Sistema iniciado correctamente</span>
                <span className="ml-auto text-gray-400">Ahora</span>
              </div>
              <p className="text-sm text-gray-500 text-center py-4">
                La actividad reciente se mostrará aquí cuando haya eventos en el sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

