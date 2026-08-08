import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-3 bg-[#F3F4F6] border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 transition-all shadow-2xs font-medium',
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

Input.displayName = 'Input';
