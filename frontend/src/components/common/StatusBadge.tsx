import React from 'react';
import { STATUS_COLORS } from '../../config/constants';
import { cn } from '../../lib/cn';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';
  const color = STATUS_COLORS[normalizedStatus] || { bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase border',
        color.bg,
        color.text,
        color.border || 'border-slate-300',
        className
      )}
    >
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
};
