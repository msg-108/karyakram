import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { passwordResetConfirmSchema, PasswordResetConfirmFormData } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { parseApiError } from '../../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const defaultEmail = location.state?.email || '';
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { email: defaultEmail },
  });

  const watchEmail = watch('email');

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    try {
      await authService.confirmPasswordReset(data);
      toast.success('Password changed successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleResendCode = async () => {
    if (!watchEmail) {
      toast.error('Please enter your email address to resend the code.');
      return;
    }
    setIsResending(true);
    try {
      await authService.resendOTP({ email: watchEmail, purpose: 'PASSWORD_RESET' });
      toast.success('A new password reset code has been sent to your email.');
      setCooldown(60);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
        <p className="text-xs text-slate-500">Enter the 6-digit code sent to your email and your new password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email Address"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="space-y-1.5">
          <FormField
            label="6-Digit Reset Code"
            placeholder="123456"
            maxLength={6}
            {...register('code')}
            error={errors.code?.message}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={cooldown > 0 || isResending}
              onClick={handleResendCode}
              className="text-xs font-bold text-slate-700 hover:text-karyakram-red-600 disabled:text-slate-400 p-0 h-auto"
            >
              {isResending
                ? 'Sending code...'
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Resend password reset code'}
            </Button>
          </div>
        </div>

        <FormField
          label="New Password"
          type="password"
          placeholder="••••••••"
          {...register('new_password')}
          error={errors.new_password?.message}
        />

        <FormField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          {...register('new_password_confirm')}
          error={errors.new_password_confirm?.message}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-base">
          Update Password
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 font-medium">
        <Link to="/login" className="font-bold text-karyakram-purple-600 hover:text-karyakram-purple-800 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};
