import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};

export const AccountCardSkeleton: React.FC = () => {
  return (
    <div className="card-static">
      <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2 rounded" />
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  );
};

export const TransactionSkeleton: React.FC = () => {
  return (
    <div className="py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-2 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded" />
    </div>
  );
};

export const WalletSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-8 w-32 mb-6 rounded" />
      <div className="card mb-6 bg-gradient-to-br from-primary/20 to-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="h-3 w-20 mb-2 rounded" />
              <Skeleton className="h-8 w-32 rounded" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>
      <div className="card">
        {[1, 2, 3, 4, 5].map((i) => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="card">
    <Skeleton className="aspect-video mb-3 rounded-lg" />
    <Skeleton className="h-5 w-3/4 mb-2 rounded" />
    <div className="flex justify-between mb-2">
      <Skeleton className="h-4 w-16 rounded" />
      <Skeleton className="h-4 w-12 rounded" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-6 w-20 rounded" />
      <Skeleton className="h-4 w-16 rounded" />
    </div>
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const OrderCardSkeleton: React.FC = () => (
  <div className="card overflow-hidden">
    <div className="flex items-center gap-3 p-4">
      <div className="w-14 h-14 bg-dark-lighter rounded-lg skeleton flex-shrink-0 relative">
        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full skeleton" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <div className="text-right flex-shrink-0 space-y-2">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded" />
          <div>
            <Skeleton className="h-5 w-40 mb-2 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

export const MessageSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-end gap-2 animate-pulse">
        <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1 max-w-[72%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-dark-lighter">
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const ReviewSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const RefundCardSkeleton: React.FC = () => (
  <div className="h-24 skeleton rounded-xl" />
);

export const RefundableOrderSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 py-4 border-b border-dark-border last:border-0">
    <div className="w-12 h-12 rounded-lg skeleton flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="h-3 w-32 skeleton rounded" />
    </div>
    <div className="h-6 w-20 skeleton rounded flex-shrink-0" />
  </div>
);

export default Skeleton;
