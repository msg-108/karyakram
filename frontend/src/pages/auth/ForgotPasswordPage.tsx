import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { passwordResetRequestSchema, PasswordResetRequestFormData } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { parseApiError } from '../../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    try {
      await authService.requestPasswordReset(data);
      toast.success('If the email exists, an OTP has been sent!');
      navigate('/reset-password', { state: { email: data.email } });
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-black text-slate-900">Reset Password</h2>
        <p className="text-xs text-slate-500">Enter your email address to receive a 6-digit reset code</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email Address"
          type="email"
          placeholder="your.email@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-base">
          Send Reset OTP
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 font-medium">
        Remember your password?{' '}
        <Link to="/login" className="font-bold text-karyakram-purple-600 hover:text-karyakram-purple-800 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
