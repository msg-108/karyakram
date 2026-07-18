/**
 * store/authStore.ts — Zustand auth store.
 *
 * Key design decisions (per the addendum):
 *
 * 1. No `user` object from login — the real LoginView returns only
 *    { access, refresh }. Role/verification state comes from decoding
 *    the access JWT directly: `login(accessToken, refreshToken)` decodes
 *    `accessToken` internally and stores role/isEmailVerified/isApproved/isStaff.
 *
 * 2. If a display name is needed (e.g. "Welcome, John"), call GET /me/
 *    separately after login — it is NOT present in the JWT. See UserDashboard.
 *
 * 3. No logout API call — POST /auth/logout/ does not exist in the real backend.
 *    logout() clears Zustand state only.
 *
 * 4. Keep Zustand (not Context) — useAuthStore.getState() is called by
 *    api/client.ts's interceptor outside the React tree, which Context can't do.
 *
 * 5. setAccessToken() re-decodes the new token so role/claims stay in sync
 *    after a silent refresh.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { AuthState, JwtClaims } from '../types/auth'

/** Safely decode a JWT and return its Karyakram-specific claims. */
function decodeClaims(token: string): {
  role: string | null
  is_email_verified: boolean
  is_approved: boolean
  is_staff: boolean
} {
  try {
    const decoded = jwtDecode<JwtClaims>(token)
    return {
      role: decoded.role ?? null,
      is_email_verified: decoded.is_email_verified ?? false,
      is_approved: decoded.is_approved ?? false,
      is_staff: decoded.is_staff ?? false,
    }
  } catch {
    return { role: null, is_email_verified: false, is_approved: false, is_staff: false }
  }
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      isEmailVerified: false,
      isApproved: false,
      isStaff: false,

      /**
       * Call after a successful POST /auth/login/ response.
       * Signature: (accessToken, refreshToken) — no user object.
       * Claims are decoded from accessToken here, not fetched separately.
       */
      login: (accessToken: string, refreshToken: string) => {
        const { role, is_email_verified, is_approved, is_staff } = decodeClaims(accessToken)
        set({
          accessToken,
          refreshToken,
          role,
          isEmailVerified: is_email_verified,
          isApproved: is_approved,
          isStaff: is_staff,
        })
      },

      /**
       * Client-side logout only — POST /auth/logout/ does not exist in the backend.
       * Clears the Zustand store; the interceptor in client.ts also calls this
       * when a refresh fails.
       */
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          isEmailVerified: false,
          isApproved: false,
          isStaff: false,
        }),

      /**
       * Called by the 401-retry interceptor in client.ts after a silent refresh.
       * Re-decodes claims so role/isStaff stay in sync with the new token.
       */
      setAccessToken: (accessToken: string) => {
        const { role, is_email_verified, is_approved, is_staff } = decodeClaims(accessToken)
        set({
          accessToken,
          role,
          isEmailVerified: is_email_verified,
          isApproved: is_approved,
          isStaff: is_staff,
        })
      },
    }),
    {
      name: 'karyakram-auth',
      // Persist tokens and decoded claims — they're all derived from the token anyway,
      // so persisting them avoids a re-decode on every page load.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        role: state.role,
        isEmailVerified: state.isEmailVerified,
        isApproved: state.isApproved,
        isStaff: state.isStaff,
      }),
    }
  )
)

export default useAuthStore
