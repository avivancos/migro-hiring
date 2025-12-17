// CRM Layout - Layout con Sidebar para páginas del CRM
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CRMSidebar } from './CRMSidebar';
import { CRMHeader } from './CRMHeader';
import { Drawer } from '@/components/common/Drawer';
import { cn } from '@/lib/utils';

const SIDEBAR_COLLAPSED_KEY = 'crm_sidebar_collapsed';

export function CRMLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
    } catch (e) {
      console.warn('Error saving sidebar state:', e);
    }
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop - Visible en pantallas >= 1024px (lg) */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-gray-200 bg-white z-40 transition-all duration-300",
        isSidebarCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <CRMSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Drawer 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        side="left" 
        size="sm"
        className="lg:hidden p-0"
      >
        <CRMSidebar onClose={() => setIsSidebarOpen(false)} />
      </Drawer>

      {/* Content area con padding para sidebar en pantallas grandes */}
      <div className={cn(
        "transition-all duration-300",
        isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <CRMHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Main Content - Ancho completo en pantallas grandes (>= 1024px) */}
        <main>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

