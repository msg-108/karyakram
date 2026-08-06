import React from 'react';
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    try {
      await authService.confirmPasswordReset(data);
      toast.success('Password changed successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(parseApiError(err));
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

        <FormField
          label="6-Digit Reset Code"
          placeholder="123456"
          maxLength={6}
          {...register('code')}
          error={errors.code?.message}
        />

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

      <p className="text-center text-xs text-slate-500">
        <Link to="/login" className="font-bold text-indigo-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};
