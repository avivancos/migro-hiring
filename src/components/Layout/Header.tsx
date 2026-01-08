// Header component

import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  // La página home no requiere autenticación, solo mostrar header básico
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-3">
              <img 
                src="/assets/migro-logo.png" 
                alt="Migro" 
                className="h-10"
              />
              <span className="text-sm text-gray-500 border-l border-gray-300 pl-3">
                Contratación
              </span>
            </a>
          </div>

          {/* User info - Solo mostrar en páginas que no sean home */}
          {!isHomePage && isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon width={16} height={16} className="text-gray-500" />
                <span className="text-gray-700">{user.full_name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon width={16} height={16} className="mr-2" />
                Salir
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

