// ProtectedRoute - Componente para proteger rutas
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Guardar la ruta a la que intentaba acceder
    const returnUrl = location.pathname + location.search;
    const loginPath = redirectTo || '/auth/login';
    return <Navigate to={`${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // Verificar permisos de admin si se requiere
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos de administrador</p>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos si se especifican
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

  return <>{children}</>;
}

