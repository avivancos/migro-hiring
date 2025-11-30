// CRMHeader - Header con navegación para todas las páginas del CRM

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import {
  Building2,
  LayoutDashboard,
  Users,
  TrendingUp,
  Calendar,
  Phone,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export function CRMHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = adminService.getUser();

  const handleLogout = () => {
    adminService.logout();
    navigate('/contrato/login');
  };

  const isActive = (path: string) => {
    if (path === '/crm') {
      return location.pathname === '/crm';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/crm', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/crm/leads', label: 'Leads', icon: TrendingUp },
    { path: '/crm/contacts', label: 'Contactos', icon: Users },
    { path: '/crm/calendar', label: 'Calendario', icon: Calendar },
    { path: '/crm/call', label: 'Llamadas', icon: Phone },
    { path: '/crm/expedientes', label: 'Expedientes', icon: FileText },
    { path: '/crm/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <Link to="/crm" className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CRM Migro</h1>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info y acciones */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>

            {/* Menú móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Navegación móvil */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

