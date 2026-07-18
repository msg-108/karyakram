/**
 * UserDashboard.tsx
 *
 * Fixes vs the old UserDashboard.jsx:
 *  1. Calls GET /api/dashboard/user/summary/ — not the phantom /dashboard/
 *  2. handleLogout() only calls logout() (Zustand clear) — no POST /auth/logout/
 *     because that endpoint doesn't exist in the real backend
 *  3. Display name comes from GET /api/me/ (first_name is not in the JWT)
 *  4. role/isApproved read from authStore, not from a user object
 */
import { useEffect, useState } from 'react'
import { getUserSummary } from '../../api/dashboard'
import { getMe } from '../../api/users'
import useAuthStore from '../../store/authStore'
import type { UserDashboardSummary } from '../../types/dashboard'
import type { UserPublic } from '../../types/auth'

export default function UserDashboard() {
  const { logout } = useAuthStore()
  const [summary, setSummary] = useState<UserDashboardSummary | null>(null)
  const [me, setMe] = useState<UserPublic | null>(null)

  useEffect(() => {
    // Load both in parallel — summary for stats, me for display name
    getUserSummary()
      .then((r) => setSummary(r.data))
      .catch(() => null) // dashboard can be slow; don't crash

    getMe()
      .then((r) => setMe(r.data))
      .catch(() => null)
  }, [])

  const handleLogout = () => {
    // No POST /auth/logout/ — that endpoint does not exist.
    // Client-side logout only: clear Zustand store.
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {me ? `Welcome, ${me.first_name}` : 'My Dashboard'}
            </h1>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
              User
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Bookings', value: summary.total_bookings },
              { label: 'Upcoming Events', value: summary.upcoming_events },
              { label: 'Total Spent', value: `Rs. ${summary.total_spent}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-muted)]">{label}</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Raw summary for debugging — remove once full UI is built */}
        <pre className="bg-white border border-[var(--color-border)] rounded-xl p-4 text-xs overflow-auto">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </div>
    </div>
  )
}
