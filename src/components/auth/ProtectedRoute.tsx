// ProtectedRoute - Componente para proteger rutas con sistema dinámico de permisos
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { routePermissionService } from '@/services/routePermissionService';
import { localDatabase } from '@/services/localDatabase';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  useDynamicPermissions?: boolean; // Nueva prop para activar permisos dinámicos
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  allowedRoles,
  redirectTo,
  useDynamicPermissions = true, // Por defecto activado
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, user, refreshUser } = useAuth();
  const location = useLocation();
  const [hasDynamicPermission, setHasDynamicPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verificar permiso dinámico si está habilitado y el usuario no es admin
  useEffect(() => {
    const checkDynamicPermission = async () => {
      // Solo verificar si:
      // 1. useDynamicPermissions está activado
      // 2. El usuario está autenticado
      // 3. No es admin/superuser (los admins siempre tienen acceso)
      // 4. No requiere admin específicamente (las rutas admin siempre requieren admin)
      if (
        useDynamicPermissions &&
        isAuthenticated &&
        user &&
        !isAdmin &&
        !requireAdmin &&
        (user.role === 'agent' || user.role === 'lawyer')
      ) {
        setIsCheckingPermission(true);
        try {
          const hasAccess = await routePermissionService.checkPermission(
            location.pathname,
            user.role
          );
          setHasDynamicPermission(hasAccess);

          // Registrar en logs
          await localDatabase.log(
            hasAccess ? 'info' : 'warn',
            hasAccess 
              ? `Acceso permitido a ruta: ${location.pathname}` 
              : `Acceso denegado a ruta: ${location.pathname}`,
            {
              context: 'protected_route',
              user_id: user.id,
              user_role: user.role,
              route_path: location.pathname,
              metadata: {
                has_access: hasAccess,
                require_admin: requireAdmin,
                allowed_roles: allowedRoles,
              },
            }
          );
        } catch (error) {
          console.error('Error verificando permiso dinámico:', error);
          // En caso de error, permitir acceso por defecto
          setHasDynamicPermission(true);
        } finally {
          setIsCheckingPermission(false);
        }
      } else {
        // Si no se aplica verificación dinámica, establecer como null
        setHasDynamicPermission(null);
      }
    };

    if (!isLoading) {
      checkDynamicPermission();
    }
  }, [location.pathname, isAuthenticated, user, isAdmin, requireAdmin, useDynamicPermissions, isLoading, allowedRoles]);

  // Si está cargando o no hay usuario pero hay tokens, esperar a que se cargue el usuario
  if (isLoading || isCheckingPermission || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Guardar la ruta a la que intentaba acceder
    const returnUrl = location.pathname + location.search;
    const loginPath = redirectTo || '/auth/login';
    return <Navigate to={`${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // Verificar permisos de admin si se requiere
  if (requireAdmin && !isAdmin) {
    // DEBUG: Log información de acceso denegado con datos completos
    console.error('🚫 [ProtectedRoute] Acceso denegado - Detalles:', {
      requireAdmin,
      isAdmin,
      user: user ? {
        email: user.email,
        role: user.role,
        is_superuser: user.is_superuser,
        is_active: user.is_active,
        full_user_object: user, // Objeto completo para debug
      } : null,
      isAuthenticated,
      isLoading,
      location: location.pathname,
      localStorage_admin_user: localStorage.getItem('admin_user'),
    });
    
    const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
        await refreshUser();
        // Esperar un momento para que se actualice el estado
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      } catch (error) {
        console.error('Error refrescando usuario:', error);
        setIsRefreshing(false);
      }
    };
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos de administrador</p>
          {user && (
            <div className="mt-4 mb-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-700 text-left">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role || 'N/A'}</p>
              <p><strong>is_superuser:</strong> {String(user.is_superuser)}</p>
              <p className="mt-2 text-xs text-gray-500">
                Si eres administrador, es posible que necesites cerrar sesión y volver a iniciar sesión 
                para actualizar tus permisos.
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? 'Refrescando...' : 'Refrescar permisos'}
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/auth/login';
              }}
              variant="default"
            >
              Ir al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos si se especifican (comportamiento original)
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = user.role;
    const hasAccess = allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección</p>
          </div>
        </div>
      );
    }
  }

  // Verificar permiso dinámico si está habilitado y se aplica
  if (hasDynamicPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta ruta. Contacta con un administrador si necesitas acceso.
          </p>
          <p className="text-sm text-gray-500 mt-2">Ruta: {location.pathname}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

