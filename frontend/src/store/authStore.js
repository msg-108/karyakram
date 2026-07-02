import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),
    }),
    {
      name: 'karyakram-auth',
      // Only persist user + refreshToken — access tokens are short-lived
      // and get re-issued silently via the refresh token on next load
      partialState: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore