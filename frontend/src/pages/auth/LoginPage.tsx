import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { parseApiError } from '../../lib/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  const toast = useToast();

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authService.login(data);
      const userObj = await authService.getCurrentUser();

      setAuthData(res.access, res.refresh, userObj);
      toast.success(`Welcome back, ${userObj.first_name}!`);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (userObj.is_staff || userObj.is_superuser || userObj.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userObj.role === 'ORGANIZER') {
        navigate('/organizer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      const errorMsg = parseApiError(err);
      if (
        errorData?.is_email_verified === false ||
        errorMsg.toLowerCase().includes('verify your email')
      ) {
        const unverifiedEmail = errorData?.email || (data.username.includes('@') ? data.username : '');
        toast.error('Please verify your email address before logging in.');
        navigate('/verify-otp', { state: { email: unverifiedEmail } });
        return;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
          Sign in to Karya<span className="text-karyakram-red-600">kram</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">Enter your username and password to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Username"
          placeholder="e.g. ktmlive or aaravsharma"
          {...register('username')}
          error={errors.username?.message}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-xs">
          <Link to="/forgot-password" className="font-bold text-karyakram-red-600 hover:text-karyakram-red-800 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5 text-base shadow-md border-0 rounded-xl">
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2 font-medium">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-karyakram-red-600 hover:text-karyakram-red-800 hover:underline">
            Register as Attendee
          </Link>
        </p>
        <p>
          Want to host events?{' '}
          <Link to="/register/organizer" className="font-bold text-karyakram-red-600 hover:text-karyakram-red-800 hover:underline">
            Register as Organizer
          </Link>
        </p>
      </div>
    </div>
  );
};
