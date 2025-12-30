import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MoreHorizontal
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Contratos', href: '/admin/contracts', icon: FileText },
  { name: 'Más', href: '/admin/more', icon: MoreHorizontal }, // Placeholder for menu
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden h-[80px] pb-safe">
      <nav className="flex justify-around items-center h-full">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-migro-green-darker' : 'text-gray-500'
              )}
            >
              <item.icon
                className={cn(
                  'h-6 w-6',
                  isActive ? 'text-migro-green-darker' : 'text-gray-400'
                )}
              />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}





















