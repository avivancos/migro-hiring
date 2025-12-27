// ProtectedRoute - Componente para proteger rutas con sistema dinámico de permisos
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { routePermissionService } from '@/services/routePermissionService';
import { localDatabase } from '@/services/localDatabase';
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
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();
  const [hasDynamicPermission, setHasDynamicPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

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
    // DEBUG: Log información de acceso denegado
    console.error('🚫 [ProtectedRoute] Acceso denegado - Detalles:', {
      requireAdmin,
      isAdmin,
      user: user ? {
        email: user.email,
        role: user.role,
        is_superuser: user.is_superuser,
      } : null,
      isAuthenticated,
      isLoading,
      location: location.pathname,
    });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos de administrador</p>
          {user && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Email: {user.email}</p>
              <p>Rol: {user.role || 'N/A'}</p>
              <p>is_superuser: {String(user.is_superuser)}</p>
            </div>
          )}
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

