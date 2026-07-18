/**
 * api/users.ts — wrappers for every users-app endpoint.
 *
 * Endpoints confirmed against apps/users/urls.py:
 *   POST  auth/register/user/
 *   POST  auth/register/organizer/    (multipart/FormData — file fields)
 *   POST  auth/verify-otp/
 *   POST  auth/resend-otp/
 *   POST  auth/login/
 *   POST  auth/token/refresh/         (handled in client.ts interceptor)
 *   GET   me/                         (read-only RetrieveAPIView — no PATCH)
 *   GET   me/organizer-profile/
 *   GET   admin/organizers/pending/
 *   POST  admin/organizers/<id>/approval/
 *
 * No logout endpoint exists in the real backend — client-side logout only.
 */
import client from './client'
import type {
  LoginPayload,
  LoginResponse,
  OrganizerApprovalPayload,
  OrganizerRegisterPayload,
  OtpResendPayload,
  OtpVerifyPayload,
  OrganizerProfile,
  UserPublic,
  UserRegisterPayload,
} from '../types/auth'

/** POST /auth/login/ — returns only { access, refresh }, no user object */
export const login = (payload: LoginPayload) =>
  client.post<LoginResponse>('/auth/login/', payload)

/** POST /auth/register/user/ */
export const registerUser = (payload: UserRegisterPayload) =>
  client.post<UserPublic>('/auth/register/user/', payload)

/**
 * POST /auth/register/organizer/
 * Uses FormData because citizenship_document and pan_document are file fields.
 * Axios will set Content-Type: multipart/form-data automatically.
 */
export const registerOrganizer = (payload: OrganizerRegisterPayload) => {
  const form = new FormData()
  const { citizenship_document, pan_document, ...rest } = payload
  ;(Object.keys(rest) as Array<keyof typeof rest>).forEach((key) => {
    const value = rest[key]
    if (value !== undefined && value !== '') {
      form.append(key, String(value))
    }
  })
  form.append('citizenship_document', citizenship_document)
  form.append('pan_document', pan_document)
  return client.post<UserPublic>('/auth/register/organizer/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** POST /auth/verify-otp/ */
export const verifyOtp = (payload: OtpVerifyPayload) =>
  client.post('/auth/verify-otp/', payload)

/** POST /auth/resend-otp/ */
export const resendOtp = (payload: OtpResendPayload) =>
  client.post('/auth/resend-otp/', payload)

/**
 * GET /me/ — read-only profile. No PATCH endpoint exists yet.
 * Used to get display name (first_name) after login since the JWT
 * does not embed name fields.
 */
export const getMe = () => client.get<UserPublic>('/me/')

/** GET /me/organizer-profile/ */
export const getMyOrganizerProfile = () =>
  client.get<OrganizerProfile>('/me/organizer-profile/')

/** GET /admin/organizers/pending/ */
export const listPendingOrganizers = () =>
  client.get<OrganizerProfile[]>('/admin/organizers/pending/')

/** POST /admin/organizers/<id>/approval/ */
export const approveOrganizer = (userId: number, payload: OrganizerApprovalPayload) =>
  client.post(`/admin/organizers/${userId}/approval/`, payload)
