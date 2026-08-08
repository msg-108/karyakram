import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User as UserIcon,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  ExternalLink,
  FileText,
  Key,
  Pencil,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import {
  updateUserSchema,
  UpdateUserFormData,
  updateOrganizerProfileSchema,
  UpdateOrganizerProfileFormData,
  passwordChangeSchema,
  PasswordChangeFormData,
} from '../../schemas/auth.schema';
import { OrganizerProfile } from '../../types/auth.types';
import { FormField } from '../../components/forms/FormField';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../lib/api';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Read-Only / Edit Toggle States
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User form
  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUserForm,
    formState: { errors: userErrors, isSubmitting: isSubmittingUser },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || '',
    },
  });

  // Organizer form
  const {
    register: registerOrg,
    handleSubmit: handleSubmitOrg,
    reset: resetOrgForm,
    formState: { errors: orgErrors, isSubmitting: isSubmittingOrg },
  } = useForm<UpdateOrganizerProfileFormData>({
    resolver: zodResolver(updateOrganizerProfileSchema),
  });

  // Password Change form
  const {
    register: registerPass,
    handleSubmit: handleSubmitPass,
    reset: resetPassForm,
    setError: setPassError,
    formState: { errors: passErrors, isSubmitting: isSubmittingPass },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  useEffect(() => {
    if (user) {
      resetUserForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
      });
    }
  }, [user, resetUserForm]);

  useEffect(() => {
    if (user?.role === 'ORGANIZER') {
      setIsLoadingProfile(true);
      authService
        .getOrganizerProfile()
        .then((profile) => {
          setOrganizerProfile(profile);
          resetOrgForm({
            organization_name: profile.organization_name || '',
            organization_description: profile.organization_description || '',
            website_url: profile.website_url || '',
          });
        })
        .catch((err) => {
          toast.error(parseApiError(err));
        })
        .finally(() => setIsLoadingProfile(false));
    }
  }, [user, resetOrgForm, toast]);

  const onUpdateUser = async (data: UpdateUserFormData) => {
    try {
      await authService.updateCurrentUser(data);
      toast.success('Personal profile updated successfully!');
      setIsEditingPersonal(false);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const onUpdateOrganizer = async (data: UpdateOrganizerProfileFormData) => {
    try {
      const updated = await authService.updateOrganizerProfile(data);
      setOrganizerProfile(updated);
      toast.success('Organization profile updated successfully!');
      setIsEditingOrg(false);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const onChangePassword = async (data: PasswordChangeFormData) => {
    try {
      await authService.changePassword(data);
      toast.success('Password updated successfully!');
      resetPassForm();
      setIsChangingPassword(false);
    } catch (err: any) {
      const fieldErrors = err?.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        if (fieldErrors.old_password) {
          const msg = Array.isArray(fieldErrors.old_password) ? fieldErrors.old_password[0] : fieldErrors.old_password;
          setPassError('old_password', { type: 'manual', message: msg });
          return;
        }
        if (fieldErrors.new_password) {
          const msg = Array.isArray(fieldErrors.new_password) ? fieldErrors.new_password[0] : fieldErrors.new_password;
          setPassError('new_password', { type: 'manual', message: msg });
          return;
        }
      }
      toast.error(parseApiError(err));
    }
  };

  const handleCancelPersonalEdit = () => {
    if (user) {
      resetUserForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
      });
    }
    setIsEditingPersonal(false);
  };

  const handleCancelOrgEdit = () => {
    if (organizerProfile) {
      resetOrgForm({
        organization_name: organizerProfile.organization_name || '',
        organization_description: organizerProfile.organization_description || '',
        website_url: organizerProfile.website_url || '',
      });
    }
    setIsEditingOrg(false);
  };

  const handleCancelPasswordChange = () => {
    resetPassForm();
    setIsChangingPassword(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            Account Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            View and manage your personal details, organization info, and security credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-karyakram-red-50 text-karyakram-red-800 border border-karyakram-red-200 shadow-2xs">
            {user?.role === 'ORGANIZER' ? 'Organizer Account' : user?.is_staff ? 'System Admin' : 'Attendee Account'}
          </span>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEditingPersonal
                  ? 'Update your name and account handle below.'
                  : 'Account display name and primary identifier.'}
              </p>
            </div>
          </div>
          {!isEditingPersonal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPersonal(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Info
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmitUser(onUpdateUser)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              placeholder="Sita"
              disabled={!isEditingPersonal}
              {...registerUser('first_name')}
              error={userErrors.first_name?.message}
            />
            <FormField
              label="Last Name"
              placeholder="Gharti"
              disabled={!isEditingPersonal}
              {...registerUser('last_name')}
              error={userErrors.last_name?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Username"
              placeholder="sitagharti"
              disabled={!isEditingPersonal}
              {...registerUser('username')}
              error={userErrors.username?.message}
            />

            {/* Read-Only Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <Lock className="w-3 h-3 text-slate-400" /> Locked
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed select-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Email address cannot be changed as it serves as your primary account key.
              </p>
            </div>
          </div>

          {isEditingPersonal && (
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelPersonalEdit}
                disabled={isSubmittingUser}
                className="gap-1 px-5"
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingUser} className="gap-2 px-6">
                <Save className="w-4 h-4" /> Save Personal Info
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <Key className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500 font-medium">
                Manage your login password to keep your account secure.
              </p>
            </div>
          </div>
          {!isChangingPassword && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Key className="w-3.5 h-3.5" /> Change Password
            </Button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleSubmitPass(onChangePassword)} className="space-y-4">
            <FormField
              label="Current Password"
              type="password"
              placeholder="••••••••"
              {...registerPass('old_password')}
              error={passErrors.old_password?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="New Password"
                type="password"
                placeholder="••••••••"
                {...registerPass('new_password')}
                error={passErrors.new_password?.message}
              />
              <FormField
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                {...registerPass('new_password_confirm')}
                error={passErrors.new_password_confirm?.message}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelPasswordChange}
                disabled={isSubmittingPass}
                className="gap-1 px-5"
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingPass} className="gap-2 px-6">
                <Lock className="w-4 h-4" /> Update Password
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-slate-700">Account Password Status: Configured & Protected</span>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">••••••••••••</span>
          </div>
        )}
      </div>

      {/* Organizer Profile & Locked Fields (Only for Organizers) */}
      {user?.role === 'ORGANIZER' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Organization Profile</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Public details shown on your published event listings.
                </p>
              </div>
            </div>
            {!isEditingOrg && !isLoadingProfile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingOrg(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Organization Info
              </Button>
            )}
          </div>

          {isLoadingProfile ? (
            <div className="py-8 text-center text-sm font-semibold text-slate-400">
              Loading organization details...
            </div>
          ) : (
            <form onSubmit={handleSubmitOrg(onUpdateOrganizer)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  label="Organization Name"
                  placeholder="Karyakram Events Team"
                  disabled={!isEditingOrg}
                  {...registerOrg('organization_name')}
                  error={orgErrors.organization_name?.message}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Organization Description</label>
                  <textarea
                    rows={3}
                    placeholder="Tell attendees about your organization and event hosting history..."
                    disabled={!isEditingOrg}
                    {...registerOrg('organization_description')}
                    className={`w-full border rounded-xl p-3 text-sm transition-all font-medium ${
                      !isEditingOrg
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-karyakram-red-600 focus:ring-2 focus:ring-karyakram-red-600/20 outline-none'
                    }`}
                  />
                  {orgErrors.organization_description && (
                    <p className="text-xs font-medium text-red-600">{orgErrors.organization_description.message}</p>
                  )}
                </div>

                <FormField
                  label="Website URL"
                  placeholder="https://example.com"
                  disabled={!isEditingOrg}
                  {...registerOrg('website_url')}
                  error={orgErrors.website_url?.message}
                />
              </div>

              {isEditingOrg && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelOrgEdit}
                    disabled={isSubmittingOrg}
                    className="gap-1 px-5"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmittingOrg} className="gap-2 px-6">
                    <Save className="w-4 h-4" /> Save Organization Info
                  </Button>
                </div>
              )}

              {/* Locked Verification Data Section */}
              <div className="mt-8 border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Verified Identity & Financial Info</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified by Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Legal citizenship, tax PAN numbers, and bank account details submitted during onboarding are locked to ensure system trust and prevent unauthorized payout changes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      Citizenship No. <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                    <p className="text-sm font-bold text-slate-800">{organizerProfile?.citizenship_number || '••••••••••••'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      PAN Number <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                    <p className="text-sm font-bold text-slate-800">{organizerProfile?.pan_number || '••••••••'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      Bank Name <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                    <p className="text-sm font-bold text-slate-800">{organizerProfile?.bank_name || 'N/A'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      Bank Account No. <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                    <p className="text-sm font-bold text-slate-800">{organizerProfile?.bank_account_number || '••••••••••••'}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {organizerProfile?.citizenship_document && (
                    <a
                      href={organizerProfile.citizenship_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                    >
                      <FileText className="w-4 h-4 text-slate-500" /> Citizenship Document <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                  {organizerProfile?.pan_document && (
                    <a
                      href={organizerProfile.pan_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                    >
                      <FileText className="w-4 h-4 text-slate-500" /> PAN Document <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
