import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-karyakram-purple-200 space-y-4 my-4 shadow-2xs">
    <div className="w-14 h-14 rounded-2xl bg-karyakram-purple-50 flex items-center justify-center text-karyakram-purple-800 border border-karyakram-purple-200/60 shadow-2xs">
      <Icon className="w-7 h-7" />
    </div>
    <div className="space-y-1 max-w-sm">
      <h3 className="text-base font-black text-karyakram-purple-900 font-heading">{title}</h3>
      {description && <p className="text-sm text-slate-600">{description}</p>}
    </div>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm">
        {actionLabel}
      </Button>
    )}
  </div>
);
