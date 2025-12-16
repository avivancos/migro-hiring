import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  isAdminMode: boolean;
  onModeSwitch: (checked: boolean) => void;
  onMenuClick?: () => void;
}

export function AdminHeader({ isAdminMode, onModeSwitch, onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 lg:pl-64">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-500"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <h1 className="ml-2 lg:ml-0 text-xl font-display font-bold text-gray-900 truncate">
             {isAdminMode ? 'Panel de Administración' : 'CRM Comercial'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
           {/* Switch Admin/CRM */}
           <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg p-1.5">
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isAdminMode ? 'text-gray-900' : 'text-gray-500'}`}>
                Admin
              </span>
              <Switch
                checked={!isAdminMode}
                onCheckedChange={(checked) => onModeSwitch(!checked)}
                aria-label="Cambiar entre Admin y CRM"
              />
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${!isAdminMode ? 'text-gray-900' : 'text-gray-500'}`}>
                CRM
              </span>
            </div>

            <div className="flex items-center gap-3">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.email || 'Usuario'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.email}
                  </span>
               </div>
               <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                 <LogOut className="h-5 w-5" />
               </Button>
            </div>
        </div>
      </div>
    </header>
  );
}



