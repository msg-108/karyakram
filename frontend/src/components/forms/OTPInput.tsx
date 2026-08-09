import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onResend?: () => void;
  isResending?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onResend,
  isResending = false,
}) => {
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Segmented values array
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, ''); // Digits only
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val[val.length - 1]; // Take last typed char
    const newCode = newDigits.join('');
    onChange(newCode);

    // Auto-advance focus to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  const handleResendClick = () => {
    if (cooldown === 0 && onResend) {
      onResend();
      setCooldown(60);
    }
  };

  return (
    <div className="space-y-6">
      {/* 6-Digit Segmented Inputs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black text-slate-900 bg-[#F3F4F6] border border-slate-300 rounded-xl focus:border-karyakram-red-600 focus:ring-2 focus:ring-karyakram-red-600/30 focus:bg-white outline-none transition-colors"
          />
        ))}
      </div>

      {/* Resend Cooldown Section */}
      {onResend && (
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-600 font-medium">Didn't receive the code?</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={cooldown > 0 || isResending}
            onClick={handleResendClick}
            className="text-xs font-bold text-slate-900 hover:text-karyakram-red-600 disabled:text-slate-400"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : 'Resend verification code'}
          </Button>
        </div>
      )}
    </div>
  );
};
