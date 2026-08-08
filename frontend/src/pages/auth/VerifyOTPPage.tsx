import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, CheckCircle2, Clock, FileText, Sparkles } from 'lucide-react';
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
      /* Organizer Post-Registration Outcome Screen (Unified Light Card Theme) */
      <div className="space-y-6 text-center p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Hero Icon */}
        <div className="w-16 h-16 bg-amber-100 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-8 h-8 text-amber-600" />
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Verification Completed
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            Application Sent for Approval!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Your email is confirmed and your organizer application & documents are now submitted for admin review.
          </p>
        </div>

        {/* Application Status Pipeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left space-y-3 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Application Pipeline</p>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Email Verification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">VERIFIED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" /> 2. Document & Admin Review
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">IN REVIEW</span>
            </div>
            <div className="flex items-center justify-between opacity-60">
              <span className="flex items-center gap-2 font-medium text-slate-500">
                <FileText className="w-4 h-4 text-slate-400" /> 3. Organizer Dashboard Access
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">PENDING</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 text-base font-bold shadow-md border-0"
        >
          Return to Sign In →
        </Button>
      </div>
    ) : (
      /* Regular User Post-Registration Outcome Screen (Unified Light Card Theme) */
      <div className="space-y-6 text-center p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Hero Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Email Confirmed
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            Account Successfully Registered!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Your email is confirmed. You can now discover events and book verified tickets instantly.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 text-base font-bold shadow-md border-0"
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
