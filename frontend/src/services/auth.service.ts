import { api, setAccessToken } from '../lib/api';
import {
  LoginFormData,
  RegisterUserFormData,
  RegisterOrganizerFormData,
  OTPVerifyFormData,
  ResendOtpFormData,
  PasswordResetRequestFormData,
  PasswordResetConfirmFormData,
  UpdateUserFormData,
  UpdateOrganizerProfileFormData,
} from '../schemas/auth.schema';
import { LoginResponse, UserPublic, OrganizerProfile } from '../types/auth.types';
import { DetailResponse } from '../types/common.types';

export const authService = {
  async login(data: LoginFormData): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login/', data);
    setAccessToken(res.data.access);
    return res.data;
  },

  async registerUser(data: RegisterUserFormData): Promise<UserPublic> {
    const res = await api.post<UserPublic>('/auth/register/user/', data);
    return res.data;
  },

  async registerOrganizer(data: RegisterOrganizerFormData): Promise<UserPublic> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    const res = await api.post<UserPublic>('/auth/register/organizer/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async verifyOTP(data: OTPVerifyFormData): Promise<DetailResponse> {
    const res = await api.post<DetailResponse>('/auth/verify-otp/', data);
    return res.data;
  },

  async resendOTP(data: ResendOtpFormData): Promise<DetailResponse> {
    const res = await api.post<DetailResponse>('/auth/resend-otp/', data);
    return res.data;
  },

  async requestPasswordReset(data: PasswordResetRequestFormData): Promise<DetailResponse> {
    const res = await api.post<DetailResponse>('/auth/password-reset/', data);
    return res.data;
  },

  async confirmPasswordReset(data: PasswordResetConfirmFormData): Promise<DetailResponse> {
    const res = await api.post<DetailResponse>('/auth/password-reset/confirm/', data);
    return res.data;
  },

  async getCurrentUser(): Promise<UserPublic> {
    const res = await api.get<UserPublic>('/me/');
    return res.data;
  },

  async updateCurrentUser(data: UpdateUserFormData): Promise<UserPublic> {
    const res = await api.patch<UserPublic>('/me/', data);
    return res.data;
  },

  async getOrganizerProfile(): Promise<OrganizerProfile> {
    const res = await api.get<OrganizerProfile>('/me/organizer-profile/');
    return res.data;
  },

  async updateOrganizerProfile(data: UpdateOrganizerProfileFormData): Promise<OrganizerProfile> {
    const res = await api.patch<OrganizerProfile>('/me/organizer-profile/', data);
    return res.data;
  },
};
