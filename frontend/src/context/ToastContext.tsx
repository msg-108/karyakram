import React, { createContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
export { useToast } from '../hooks/useToast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

export interface ToastContextValue {
  toast: {
    success: (message: string, options?: { action?: ToastAction }) => void;
    error: (message: string, options?: { action?: ToastAction }) => void;
    warning: (message: string, options?: { action?: ToastAction }) => void;
    info: (message: string, options?: { action?: ToastAction }) => void;
  };
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: { action?: ToastAction }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, action: options?.action };

      setToasts((prev) => [...prev.slice(-2), newToast]); // Limit to max 3 toasts

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastHelpers = {
    success: (msg: string, opts?: { action?: ToastAction }) => addToast('success', msg, opts),
    error: (msg: string, opts?: { action?: ToastAction }) => addToast('error', msg, opts),
    warning: (msg: string, opts?: { action?: ToastAction }) => addToast('warning', msg, opts),
    info: (msg: string, opts?: { action?: ToastAction }) => addToast('info', msg, opts),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHelpers, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
              <span className="truncate font-medium">{t.message}</span>
            </div>

            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  removeToast(t.id);
                }}
                className="text-xs font-semibold underline px-2 py-1 rounded hover:bg-black/5 shrink-0"
              >
                {t.action.label}
              </button>
            )}

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
