// Hook para verificar permisos de rutas dinámicas
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { routePermissionService } from '@/services/routePermissionService';
import { localDatabase } from '@/services/localDatabase';

export function useRoutePermission() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkPermission = useCallback(async (routePath: string) => {
    if (!isAuthenticated || !user) {
      setHasPermission(false);
      setIsChecking(false);
      return;
    }

    // Los admins y superusers siempre tienen acceso
    if (user.role === 'admin' || user.role === 'superuser' || user.is_superuser) {
      setHasPermission(true);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      const hasAccess = await routePermissionService.checkPermission(routePath, user.role);
      setHasPermission(hasAccess);

      // Registrar acceso o denegación en logs
      await localDatabase.log(
        hasAccess ? 'info' : 'warn',
        hasAccess ? 'Acceso permitido a ruta' : 'Acceso denegado a ruta',
        {
          context: 'route_permission',
          user_id: user.id,
          user_role: user.role,
          route_path: routePath,
          metadata: {
            has_access: hasAccess,
            timestamp: new Date().toISOString(),
          },
        }
      );
    } catch (error) {
      console.error('Error verificando permiso:', error);
      // En caso de error, permitir acceso por defecto
      setHasPermission(true);
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkPermission(location.pathname);
    } else {
      setHasPermission(false);
      setIsChecking(false);
    }
  }, [location.pathname, isAuthenticated, user, checkPermission]);

  return {
    hasPermission,
    isChecking,
    checkPermission: (routePath: string) => checkPermission(routePath),
  };
}

