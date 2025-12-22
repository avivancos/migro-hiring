import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Shield, 
  MessageSquare, 
  Phone
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Contratos', href: '/admin/contracts', icon: FileText },
  { name: 'Tipos de Llamadas', href: '/admin/call-types', icon: Phone },
  { name: 'Auditoría', href: '/admin/audit-logs', icon: Shield },
  { name: 'Conversaciones', href: '/admin/conversations', icon: MessageSquare },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto h-full", className)}>
      <div className="flex items-center flex-shrink-0 px-4 mb-5">
        <img
          className="h-8 w-auto"
          src="/assets/migro-logo.png"
          alt="Migro"
        />
        <span className="ml-3 text-xl font-display font-bold text-migro-green-darker">
          Admin
        </span>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                isActive
                  ? 'bg-migro-green text-migro-green-darker'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-migro-green-darker' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

