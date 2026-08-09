import React from 'react';
import { cn } from '../../lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'slate', children, ...props }) => {
  const variants = {
    slate: 'bg-stone-100 text-stone-700 border-stone-200',
    indigo: 'bg-karyakram-purple-50 text-karyakram-purple-800 border-karyakram-purple-200',
    emerald: 'bg-karyakram-purple-50 text-karyakram-purple-800 border-karyakram-purple-200',
    amber: 'bg-karyakram-gold-50 text-karyakram-gold-800 border-karyakram-gold-200',
    rose: 'bg-karyakram-red-50 text-karyakram-red-800 border-karyakram-red-200',
    blue: 'bg-karyakram-purple-50 text-karyakram-purple-800 border-karyakram-purple-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
