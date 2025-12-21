// Wrapper para lazy loading de componentes
// Muestra skeleton mientras carga

import { Suspense, type ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Skeleton } from './Skeleton';

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: 'spinner' | 'skeleton';
  skeletonCount?: number;
}

export function LazyLoadWrapper({
  children,
  fallback = 'spinner',
  skeletonCount = 3,
}: LazyLoadWrapperProps) {
  if (fallback === 'skeleton') {
    return (
      <Suspense
        fallback={
          <div className="space-y-4 p-6">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
      >
        {children}
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

