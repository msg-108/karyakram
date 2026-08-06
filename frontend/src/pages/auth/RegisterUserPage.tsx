import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerUserSchema, RegisterUserFormData } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { parseApiError } from '../../lib/api';

export const RegisterUserPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterUserFormData>({
    resolver: zodResolver(registerUserSchema),
  });

  const onSubmit = async (data: RegisterUserFormData) => {
    try {
      await authService.registerUser(data);
      toast.success('Account created! Please verify your email OTP.');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-black text-slate-900">Create Attendee Account</h2>
        <p className="text-xs text-slate-500">Book tickets and track your upcoming events</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First Name"
            placeholder="Sita"
            {...register('first_name')}
            error={errors.first_name?.message}
          />
          <FormField
            label="Last Name"
            placeholder="Gharti"
            {...register('last_name')}
            error={errors.last_name?.message}
          />
        </div>

        <FormField
          label="Username"
          placeholder="sitagharti"
          {...register('username')}
          error={errors.username?.message}
        />

        <FormField
          label="Email Address"
          type="email"
          placeholder="sita@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <FormField
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          {...register('password_confirm')}
          error={errors.password_confirm?.message}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-base">
          Create Account & Send OTP
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-indigo-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
