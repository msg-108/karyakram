import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Failed to load data',
  message,
  onRetry,
}) => (
  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 my-4">
    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <h4 className="text-sm font-bold">{title}</h4>
      <p className="text-xs text-rose-700">{message}</p>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="bg-white hover:bg-rose-100/50 border-rose-300 text-rose-700">
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </Button>
    )}
  </div>
);
