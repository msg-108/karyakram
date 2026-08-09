import React from 'react';
import { cn } from '../../lib/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-[#F3F4F6] rounded-2xl border border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6 pb-4 border-b border-slate-300', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-black text-slate-900 tracking-tight font-heading', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-4 border-t border-slate-300 bg-slate-200/50', className)} {...props}>
    {children}
  </div>
);
