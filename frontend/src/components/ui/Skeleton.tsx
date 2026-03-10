import { memo } from 'react';

const Skeleton: React.FC<{ className?: string }> = memo(({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
));

export const CardSkeleton: React.FC = memo(() => (
  <div className="card">
    <Skeleton className="aspect-video mb-3" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <div className="flex justify-between mb-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
));

export const ListSkeleton: React.FC<{ count?: number }> = memo(({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded" />
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
));

export const GridSkeleton: React.FC<{ count?: number }> = memo(({ count = 8 }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
));

export default Skeleton;
