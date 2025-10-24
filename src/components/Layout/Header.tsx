// Header component

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

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

          {/* User info */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-gray-500" />
                <span className="text-gray-700">{user.full_name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} className="mr-2" />
                Salir
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

