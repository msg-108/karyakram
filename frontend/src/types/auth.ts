// ─────────────────────────────────────────────
// JWT & Auth state
// ─────────────────────────────────────────────

/** Claims embedded in the access JWT by UserTokenObtainPairSerializer.get_token() */
export interface JwtClaims {
  /** "USER" | "ORGANIZER" — matches User.Role choices (uppercase) */
  role: string;
  is_email_verified: boolean;
  is_approved: boolean;
  is_staff: boolean;
  /** Standard JWT fields */
  user_id: number;
  exp: number;
  iat: number;
  jti: string;
}

/** Shape of the authStore — what is persisted and accessed from components/api */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** Decoded from the JWT on login — "USER" | "ORGANIZER" */
  role: string | null;
  isEmailVerified: boolean;
  isApproved: boolean;
  /** True for Django staff/superuser — controls admin dashboard routing */
  isStaff: boolean;

  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

/** POST /api/auth/login/ body */
export interface LoginPayload {
  username: string;
  password: string;
}

/** POST /api/auth/login/ response — no user object, only tokens */
export interface LoginResponse {
  access: string;
  refresh: string;
}

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────

/** POST /api/auth/register/user/ body */
export interface UserRegisterPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

/**
 * POST /api/auth/register/organizer/ — sent as multipart/FormData because
 * citizenship_document and pan_document are file fields.
 */
export interface OrganizerRegisterPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  organization_name: string;
  organization_description?: string;
  website_url?: string;
  citizenship_number: string;
  pan_number: string;
  bank_name: string;
  bank_account_number: string;
  citizenship_document: File;
  pan_document: File;
}

// ─────────────────────────────────────────────
// OTP
// ─────────────────────────────────────────────

/** POST /api/auth/verify-otp/ body */
export interface OtpVerifyPayload {
  email: string;
  code: string;
}

/** POST /api/auth/resend-otp/ body */
export interface OtpResendPayload {
  email: string;
}

// ─────────────────────────────────────────────
// User / Profile
// ─────────────────────────────────────────────

/**
 * Mirrors UserPublicSerializer — returned by GET /api/me/
 * and nested in OrganizerProfileSerializer.
 * Note: /api/me/ is read-only (RetrieveAPIView). No PATCH endpoint exists.
 */
export interface UserPublic {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_email_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

/** Mirrors OrganizerProfileSerializer — returned by GET /api/me/organizer-profile/ */
export interface OrganizerProfile {
  id: number;
  user: UserPublic;
  organization_name: string;
  organization_description: string;
  website_url: string;
  bank_name: string;
  citizenship_document: string;
  pan_document: string;
  approval_requested_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
}

/** POST /api/admin/organizers/<id>/approval/ body */
export interface OrganizerApprovalPayload {
  action: 'approve' | 'reject';
  reason?: string;
}
