import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-karyakram-gold-600 hover:bg-karyakram-gold-800 text-karyakram-red-900 hover:text-white font-black focus-visible:outline-karyakram-gold-600 shadow-md shadow-karyakram-gold-600/25 border-0',
      secondary: 'bg-karyakram-indigo-600 hover:bg-karyakram-indigo-800 text-white font-bold focus-visible:outline-karyakram-indigo-600 shadow-sm border-0',
      outline: 'border border-karyakram-red-600 bg-[#F5F6F8] text-karyakram-red-600 hover:bg-karyakram-red-50 focus-visible:outline-karyakram-red-600 shadow-2xs font-bold',
      ghost: 'text-slate-700 hover:bg-karyakram-red-50 hover:text-karyakram-red-800 focus-visible:outline-karyakram-red-600 font-semibold',
      danger: 'bg-karyakram-red-800 text-white hover:bg-karyakram-red-900 focus-visible:outline-karyakram-red-800 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
