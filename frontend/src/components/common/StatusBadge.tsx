import React from 'react';
import { STATUS_COLORS } from '../../config/constants';
import { cn } from '../../lib/cn';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';
  const color = STATUS_COLORS[normalizedStatus] || { bg: 'bg-slate-100', text: 'text-slate-700' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase',
        color.bg,
        color.text,
        className
      )}
    >
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
};
