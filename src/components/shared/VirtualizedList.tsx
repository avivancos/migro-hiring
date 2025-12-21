// Lista virtualizada para rendimiento con listas largas
// Usa react-window si está disponible, sino fallback a renderizado normal

import { type ReactNode, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

// Fallback simple sin virtualización si react-window no está disponible
export function VirtualizedList<T>({
  items,
  renderItem,
  containerHeight = 600,
  className,
}: VirtualizedListProps<T>) {
  // Por ahora, renderizado simple
  // En producción, se puede instalar react-window y usar FixedSizeList
  const renderedItems = useMemo(
    () => items.map((item, index) => renderItem(item, index)),
    [items, renderItem]
  );

  return (
    <div
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
      }}
    >
      {renderedItems}
    </div>
  );
}

// Hook para detectar si se debe usar virtualización
export function useVirtualization(itemsCount: number, threshold = 50) {
  return itemsCount > threshold;
}

