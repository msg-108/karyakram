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
      /* Organizer Post-Registration Outcome Screen (Rich Gradient Card) */
      <div className="space-y-6 text-center p-8 bg-gradient-to-b from-purple-950 via-slate-900 to-purple-950 text-white rounded-3xl border border-purple-800/40 shadow-2xl relative overflow-hidden">
        {/* Ambient glow background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/30">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-purple-300" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Verification Completed
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Application Sent for Approval!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Your email is confirmed and your organizer documents have been submitted for administrator review.
          </p>
        </div>

        {/* Status Pipeline Stepper */}
        <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl p-4 text-left space-y-3 shadow-inner relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Application Pipeline</p>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Email Verification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">VERIFIED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-amber-300 font-medium">
                <Clock className="w-4 h-4 text-amber-400" /> 2. Document & Admin Review
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">IN REVIEW</span>
            </div>
            <div className="flex items-center justify-between opacity-60">
              <span className="flex items-center gap-2 text-slate-400 font-medium">
                <FileText className="w-4 h-4 text-slate-400" /> 3. Organizer Portal Access
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400">PENDING</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-4 text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-900/50 border-0 transition-all transform hover:-translate-y-0.5 relative z-10"
        >
          Return to Sign In →
        </Button>
      </div>
    ) : (
      /* Regular User Post-Registration Outcome Screen (Gold Gradient Card) */
      <div className="space-y-6 text-center p-8 bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl border border-amber-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Email Confirmed
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Account Successfully Verified!</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Your email is confirmed. You can now discover events and book verified tickets instantly.
          </p>
        </div>

        <Button
          onClick={() => navigate('/login')}
          className="w-full py-4 text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl shadow-lg shadow-amber-900/50 border-0 transition-all transform hover:-translate-y-0.5 relative z-10"
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
