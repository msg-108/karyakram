import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerOrganizerSchema, RegisterOrganizerFormData } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/forms/FormField';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { Button } from '../../components/ui/Button';
import { parseApiError } from '../../lib/api';

export const RegisterOrganizerPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterOrganizerFormData>({
    resolver: zodResolver(registerOrganizerSchema),
  });

  const onSubmit = async (data: RegisterOrganizerFormData) => {
    try {
      await authService.registerOrganizer(data);
      toast.success('Organizer account created! Please verify your email.');
      navigate('/verify-otp', { state: { email: data.email, isOrganizer: true } });
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <div className="space-y-8 max-w-3xl lg:max-w-4xl mx-auto py-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight">
          Register as <span className="text-indigo-600">Organizer</span>
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Provide organization and legal verification details to host and publish events across Nepal
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">1. Account Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" placeholder="Aman" {...register('first_name')} error={errors.first_name?.message} />
            <FormField label="Last Name" placeholder="Shrestha" {...register('last_name')} error={errors.last_name?.message} />
          </div>
          <FormField label="Username" placeholder="amanorg" {...register('username')} error={errors.username?.message} />
          <FormField label="Email Address" type="email" placeholder="aman@org.com" {...register('email')} error={errors.email?.message} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <FormField label="Confirm Password" type="password" placeholder="••••••••" {...register('password_confirm')} error={errors.password_confirm?.message} />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Organization & Verification</h3>
          <FormField label="Organization Name" placeholder="TechEvents Nepal Ltd" {...register('organization_name')} error={errors.organization_name?.message} />
          <FormField label="Description" as="textarea" rows={2} placeholder="Brief details about your organization" {...register('organization_description')} />
          <FormField label="Website URL (Optional)" placeholder="https://example.com" {...register('website_url')} error={errors.website_url?.message} />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Citizenship Number" placeholder="12-01-78-0012" {...register('citizenship_number')} error={errors.citizenship_number?.message} />
            <FormField label="PAN Number" placeholder="600123456" {...register('pan_number')} error={errors.pan_number?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Controller
              name="citizenship_document"
              control={control}
              render={({ field }) => (
                <FileDropzone
                  label="Citizenship Document"
                  file={field.value}
                  onChange={field.onChange}
                  error={errors.citizenship_document?.message as string}
                />
              )}
            />

            <Controller
              name="pan_document"
              control={control}
              render={({ field }) => (
                <FileDropzone
                  label="PAN Document"
                  file={field.value}
                  onChange={field.onChange}
                  error={errors.pan_document?.message as string}
                />
              )}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Bank Account (For Ticket Payouts)</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Bank Name" placeholder="Nabil Bank" {...register('bank_name')} error={errors.bank_name?.message} />
            <FormField label="Account Number" placeholder="01201017500001" {...register('bank_account_number')} error={errors.bank_account_number?.message} />
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-base">
          Submit Organizer Application
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-indigo-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
