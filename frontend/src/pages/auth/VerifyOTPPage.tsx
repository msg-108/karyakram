import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { OTPInput } from '../../components/forms/OTPInput';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../lib/api';

export const VerifyOTPPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const email = location.state?.email || '';
  const isOrganizer = location.state?.isOrganizer || false;

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || code.length !== 6) return;

    setIsVerifying(true);
    try {
      await authService.verifyOTP({ email, code });
      toast.success('Email verified successfully!');

      if (isOrganizer) {
        toast.info('Your organizer application is under admin review.');
      }

      navigate('/login');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await authService.resendOTP({ email });
      toast.success('A new 6-digit code has been sent to your email.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900">Verify Your Email</h2>
        <p className="text-xs text-slate-500">
          We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email || 'your email'}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <OTPInput
          length={6}
          value={code}
          onChange={setCode}
          onResend={handleResend}
          isResending={isResending}
        />

        <Button
          type="submit"
          disabled={code.length !== 6}
          isLoading={isVerifying}
          className="w-full py-3 text-base"
        >
          Verify & Continue
        </Button>
      </form>
    </div>
  );
};
