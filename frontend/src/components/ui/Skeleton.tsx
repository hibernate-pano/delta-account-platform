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
