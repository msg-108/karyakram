import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!email) {
      toast.error('Session expired or missing email for verification.');
      navigate('/register', { replace: true });
    }
  }, [email, navigate, toast]);

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || code.length !== 6) return;

    setIsVerifying(true);
    try {
      await authService.verifyOTP({ email, code });
      setIsSuccess(true);
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

  if (isSuccess) {
    return isOrganizer ? (
      /* Organizer Post-Registration Outcome Screen (Purple Accent) */
      <div className="space-y-6 text-center p-6 bg-karyakram-purple-50 border border-karyakram-purple-200 rounded-2xl shadow-xs">
        <div className="w-16 h-16 bg-karyakram-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-karyakram-purple-900">Application Sent for Approval</h2>
          <p className="text-xs text-karyakram-purple-800 max-w-sm mx-auto leading-relaxed">
            Your organizer account & documents have been submitted to admin review. You will receive an email update once verified.
          </p>
        </div>
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-3 text-base bg-karyakram-purple-600 text-white hover:bg-karyakram-purple-800 shadow-sm border-0"
        >
          Return to Sign In
        </Button>
      </div>
    ) : (
      /* Regular User Post-Registration Outcome Screen (Gold Accent) */
      <div className="space-y-6 text-center p-6 bg-karyakram-gold-50 border border-karyakram-gold-200 rounded-2xl shadow-xs">
        <div className="w-16 h-16 bg-karyakram-gold-600 text-karyakram-purple-900 rounded-2xl flex items-center justify-center mx-auto shadow-md font-bold">
          <Mail className="w-8 h-8 text-karyakram-purple-900" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-karyakram-gold-900">Account Successfully Registered!</h2>
          <p className="text-xs text-karyakram-gold-800 max-w-sm mx-auto leading-relaxed">
            Your email is verified. You can now discover events and book verified tickets instantly.
          </p>
        </div>
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-3 text-base shadow-md border-0"
        >
          Sign In Now →
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="w-14 h-14 bg-karyakram-purple-50 text-karyakram-purple-800 border border-karyakram-purple-200 rounded-2xl flex items-center justify-center mx-auto">
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
