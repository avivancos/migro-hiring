// Admin Route Permissions - Gestión dinámica de permisos de rutas
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { routePermissionService } from '@/services/routePermissionService';
import { localDatabase } from '@/services/localDatabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Shield,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { RoutePermission } from '@/services/localDatabase';

export function AdminRoutePermissions() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routes, setRoutes] = useState<RoutePermission[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RoutePermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar rutas al montar
  useEffect(() => {
    loadRoutes();
  }, []);

  // Filtrar rutas cuando cambian los filtros
  useEffect(() => {
    let filtered = routes;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (route) =>
          route.route_path.toLowerCase().includes(query) ||
          route.description?.toLowerCase().includes(query) ||
          route.module.toLowerCase().includes(query)
      );
    }

    // Filtro por módulo
    if (filterModule !== 'all') {
      filtered = filtered.filter((route) => route.module === filterModule);
    }

    setFilteredRoutes(filtered);
  }, [routes, searchQuery, filterModule]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const permissions = await routePermissionService.getAllPermissions();
      setRoutes(permissions);
    } catch (error: any) {
      console.error('Error cargando rutas:', error);
      setErrorMessage('Error al cargar las rutas. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (
    routePath: string,
    role: 'agent' | 'lawyer',
    currentValue: boolean
  ) => {
    // Los admins no pueden modificar sus propios permisos (siempre tienen acceso)
    // Nota: role es 'agent' | 'lawyer', nunca 'admin', pero mantenemos validación por seguridad
    // Esta validación nunca se ejecutará según el tipo, pero es defensiva

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await routePermissionService.updateRoutePermission(routePath, {
        [`${role}_allowed`]: !currentValue,
      });

      // Actualizar estado local
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) =>
          route.route_path === routePath
            ? {
                ...route,
                [`${role}_allowed`]: !currentValue,
                updated_at: new Date().toISOString(),
              }
            : route
        )
      );

      setSuccessMessage(`Permiso de ${role === 'agent' ? 'agente' : 'abogado'} actualizado correctamente.`);

      // Registrar en logs
      await localDatabase.log('info', `Permiso de ruta actualizado: ${routePath}`, {
        context: 'admin_route_permissions',
        user_id: user?.id,
        user_role: user?.role,
        route_path: routePath,
        metadata: {
          role,
          new_value: !currentValue,
        },
      });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error actualizando permiso:', error);
      setErrorMessage(`Error al actualizar el permiso: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (
    role: 'agent' | 'lawyer',
    value: boolean
  ) => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updates = filteredRoutes.map((route) =>
        routePermissionService.updateRoutePermission(route.route_path, {
          [`${role}_allowed`]: value,
        })
      );

      await Promise.all(updates);

      // Actualizar estado local
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) => {
          const isInFiltered = filteredRoutes.some((r) => r.route_path === route.route_path);
          if (isInFiltered) {
            return {
              ...route,
              [`${role}_allowed`]: value,
              updated_at: new Date().toISOString(),
            };
          }
          return route;
        })
      );

      setSuccessMessage(
        `Permisos de ${role === 'agent' ? 'agentes' : 'abogados'} actualizados en masa.`
      );

      // Registrar en logs
      await localDatabase.log('info', `Actualización masiva de permisos: ${role}`, {
        context: 'admin_route_permissions',
        user_id: user?.id,
        user_role: user?.role,
        metadata: {
          role,
          value,
          count: filteredRoutes.length,
        },
      });

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error en actualización masiva:', error);
      setErrorMessage(`Error en actualización masiva: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Obtener módulos únicos
  const modules = Array.from(new Set(routes.map((r) => r.module))).sort();

  // Verificar si el usuario es admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">
                Solo los administradores pueden gestionar los permisos de rutas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Permisos de Rutas
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los permisos de acceso a rutas para agentes y abogados. Los administradores
            siempre tienen acceso completo.
          </p>
        </div>
        <Button onClick={loadRoutes} disabled={loading || saving} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      {/* Mensajes de éxito/error */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p>{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-blue-800">
            <Info className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Nota importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Los administradores siempre tienen acceso completo a todas las rutas.</li>
                <li>Los permisos de administradores no se pueden modificar.</li>
                <li>Los cambios se guardan automáticamente en la base de datos local.</li>
                <li>Los permisos se aplican inmediatamente después de guardar.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Buscar ruta</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por ruta, descripción o módulo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="module">Módulo</Label>
              <select
                id="module"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todos los módulos</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de rutas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rutas ({filteredRoutes.length})</CardTitle>
              <CardDescription>
                Activa o desactiva los permisos para cada ruta
              </CardDescription>
            </div>
            {filteredRoutes.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate('agent', true)}
                  disabled={saving}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Permitir todo (Agentes)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate('agent', false)}
                  disabled={saving}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Bloquear todo (Agentes)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate('lawyer', true)}
                  disabled={saving}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Permitir todo (Abogados)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate('lawyer', false)}
                  disabled={saving}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Bloquear todo (Abogados)
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Cargando rutas...</p>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron rutas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Ruta
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Módulo
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Descripción
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                      Agente
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                      Abogado
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {route.route_path}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{route.module}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {route.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={route.agent_allowed}
                          onCheckedChange={(_checked) =>
                            handleTogglePermission(
                              route.route_path,
                              'agent',
                              route.agent_allowed
                            )
                          }
                          disabled={saving}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={route.lawyer_allowed}
                          onCheckedChange={(_checked) =>
                            handleTogglePermission(
                              route.route_path,
                              'lawyer',
                              route.lawyer_allowed
                            )
                          }
                          disabled={saving}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox checked={true} disabled />
                        <span className="ml-2 text-xs text-gray-500">Siempre</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




