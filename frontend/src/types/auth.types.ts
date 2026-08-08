import { RoleEnum } from './common.types';

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RoleEnum;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_email_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface OrganizerProfile {
  id: number;
  user: UserPublic;
  organization_name: string;
  organization_description: string;
  website_url: string;
  bank_name: string;
  citizenship_document: string | null;
  pan_document: string | null;
  approval_requested_at: string;
  approved_at: string | null;
  rejection_reason: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface JWTClaims {
  user_id: number;
  username: string;
  email: string;
  role: RoleEnum;
  is_staff: boolean;
  exp: number;
}
