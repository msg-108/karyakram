import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-[#F3F4F6] border border-slate-300 rounded-xl text-sm text-slate-900 transition-all cursor-pointer shadow-2xs font-medium',
            'focus:outline-none focus:border-karyakram-red-600 focus:ring-2 focus:ring-karyakram-red-600/30 focus:bg-white',
            error && 'border-orange-500 focus:border-orange-600 focus:ring-orange-500/20 text-orange-950',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-orange-600 font-bold">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
