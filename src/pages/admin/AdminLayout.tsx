// Admin Layout - Layout con switch Admin/CRM y Sidebar
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Sidebar } from '@/components/admin/Sidebar';
import { BottomNav } from '@/components/admin/BottomNav';
import { AdminHeader } from '@/components/admin/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Drawer } from '@/components/common/Drawer';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  useEffect(() => {
    // Determinar modo inicial basado en la ruta
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isCrmRoute = location.pathname.startsWith('/crm');
    
    if (isCrmRoute) {
      setIsAdminMode(false);
    } else if (isAdminRoute) {
      setIsAdminMode(true);
    }
  }, [location.pathname]);

  const handleModeSwitch = (checked: boolean) => {
    setIsAdminMode(checked);
    if (checked) {
      navigate('/admin/dashboard');
    } else {
      navigate('/crm');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    // DEBUG: Log información de acceso denegado en AdminLayout
    console.error('🚫 [AdminLayout] Acceso denegado - Detalles:', {
      isAuthenticated,
      isAdmin,
      user: user ? {
        email: user.email,
        role: user.role,
        is_superuser: user.is_superuser,
      } : null,
      isLoading,
    });
    return null; // ProtectedRoute manejará la redirección
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Drawer 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        side="left" 
        size="sm"
        className="lg:hidden p-0"
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </Drawer>

      {/* Header */}
      <AdminHeader 
        isAdminMode={isAdminMode} 
        onModeSwitch={handleModeSwitch}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* Main Content */}
      <main className="lg:pl-64 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <BottomNav />
    </div>
  );
}
