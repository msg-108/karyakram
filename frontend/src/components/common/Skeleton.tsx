import React from 'react';
import { cn } from '../../lib/cn';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} {...props} />
);

export const EventCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-4 p-4">
    <Skeleton className="h-44 w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="pt-2 flex justify-between items-center">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
  </div>
);
