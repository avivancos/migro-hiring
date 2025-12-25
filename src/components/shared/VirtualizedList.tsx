// Lista virtualizada para rendimiento con listas largas
// Implementación optimizada con windowing manual para mejor rendimiento

import { type ReactNode, useMemo, useState, useRef, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  overscan?: number; // Número de items a renderizar fuera de la vista
}

// Implementación optimizada de virtualización con windowing manual
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 100,
  containerHeight = 600,
  className,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular qué items están visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Renderizar solo items visibles
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const itemsToRender: Array<{ item: T; index: number }> = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        itemsToRender.push({ item: items[i], index: i });
      }
    }
    
    return itemsToRender;
  }, [items, visibleRange]);

  // Calcular altura total del contenedor virtual
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      {/* Contenedor virtual con altura total */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {/* Contenedor de items visibles */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook para detectar si se debe usar virtualización
export function useVirtualization(itemsCount: number, threshold = 50) {
  return useMemo(() => itemsCount > threshold, [itemsCount, threshold]);
}

// Hook para calcular altura de item dinámicamente
export function useItemHeight<T>(
  items: T[],
  estimateHeight: (item: T) => number,
  defaultHeight: number = 100
) {
  return useMemo(() => {
    if (items.length === 0) return defaultHeight;
    
    // Calcular altura promedio de los primeros items
    const sampleSize = Math.min(10, items.length);
    const heights = items.slice(0, sampleSize).map(estimateHeight);
    const averageHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    
    return Math.max(defaultHeight, Math.round(averageHeight));
  }, [items, estimateHeight, defaultHeight]);
}

