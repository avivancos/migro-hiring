import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  Phone,
  FileText,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
  { name: 'Contactos', href: '/crm/contacts', icon: Users },
  { name: 'Calendario', href: '/crm/calendar', icon: Calendar },
  { name: 'Llamadas', href: '/crm/call', icon: Phone },
  { name: 'Expedientes', href: '/crm/expedientes', icon: FileText },
  { name: 'Configuración', href: '/crm/settings', icon: Settings },
];

interface CRMSidebarProps {
  className?: string;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function CRMSidebar({ className, onClose, isCollapsed = false, onToggle }: CRMSidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto h-full relative", className)}>
      {/* Header con logo y botón toggle */}
      <div className={cn(
        "flex items-center flex-shrink-0 mb-5 transition-all duration-300 relative",
        isCollapsed ? "px-2 justify-center" : "px-4"
      )}>
        {!isCollapsed && (
          <div className="flex items-center flex-1">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="ml-3 text-xl font-display font-bold text-primary">
              CRM Migro
            </span>
          </div>
        )}
        {isCollapsed && (
          <Building2 className="h-8 w-8 text-primary" />
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 flex-shrink-0 hover:bg-gray-100",
              isCollapsed ? "absolute top-2 right-0" : "ml-2"
            )}
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navegación */}
      <nav className={cn(
        "mt-5 flex-1 space-y-1",
        isCollapsed ? "px-2" : "px-2"
      )}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/crm' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center text-sm font-medium rounded-md transition-colors',
                isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500',
                  'flex-shrink-0 h-5 w-5 transition-colors',
                  !isCollapsed && 'mr-3'
                )}
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span>{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

