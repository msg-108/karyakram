// src/pages/dashboard/OrganizerDashboard.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function OrganizerDashboard() {
  const { user, logout } = useAuthStore()
  const [data, setData]  = useState(null)

  useEffect(() => {
    api.get('/dashboard/').then(r => setData(r.data))
  }, [])

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState()
    await api.post('/auth/logout/', { refresh: refreshToken }).catch(() => {})
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {user?.organization_name || 'Organizer Dashboard'}
            </h1>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {data?.is_approved ? 'Approved Organizer' : 'Pending Approval'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {data?.message && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
            {data.message}
          </div>
        )}

        {/* TODO (Siddhant): events table, ticket stats, revenue summary */}
        <pre className="bg-white border border-[var(--color-border)] rounded-xl p-4 text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}