// Componente Timeline genérico
// Mobile-first con diseño vertical optimizado

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  groupByDate?: boolean;
}

export function Timeline({ items, className, groupByDate = true }: TimelineProps) {
  const groupedItems = groupByDate
    ? items.reduce((acc, item) => {
        const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {} as Record<string, TimelineItem[]>)
    : { 'all': items };

  const getVariantStyles = (variant: TimelineItem['variant'] = 'default') => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedItems).map(([date, dateItems]) => (
        <div key={date} className="space-y-4">
          {groupByDate && (
            <div className="sticky top-0 bg-white py-2 z-10 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
            </div>
          )}
          <div className="relative pl-8 space-y-4">
            {/* Línea vertical */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            {dateItems.map((item) => (
              <div key={item.id} className="relative">
                {/* Punto en la línea */}
                <div
                  className={cn(
                    'absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white',
                    getVariantStyles(item.variant)
                  )}
                />
                
                {/* Contenido */}
                <div className="ml-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon && <span className="text-gray-500">{item.icon}</span>}
                        <h4 className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </h4>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-1">
                          {item.description}
                        </p>
                      )}
                      {item.user && (
                        <p className="text-xs text-gray-500">
                          Por {item.user}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(item.timestamp), 'HH:mm', { locale: es })}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

