import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 4, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 bg-[#F3F4F6] border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 transition-all shadow-2xs font-medium resize-y',
            'focus:outline-none focus:border-karyakram-red-600 focus:ring-2 focus:ring-karyakram-red-600/30 focus:bg-white',
            error && 'border-orange-500 focus:border-orange-600 focus:ring-orange-500/20 text-orange-950',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-orange-600 font-bold">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-600">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
