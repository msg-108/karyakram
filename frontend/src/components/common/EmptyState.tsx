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
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4 my-4">
    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
      <Icon className="w-7 h-7" />
    </div>
    <div className="space-y-1 max-w-sm">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm">
        {actionLabel}
      </Button>
    )}
  </div>
);
