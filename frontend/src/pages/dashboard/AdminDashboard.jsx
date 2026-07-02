// src/pages/dashboard/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function AdminDashboard() {
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
              Admin Panel
            </h1>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Administrator
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Quick stats */}
        {data?.stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Users',      value: data.stats.total_users },
              { label: 'Total Organizers', value: data.stats.total_organizers },
              { label: 'Pending Approvals', value: data.stats.pending_organizer_approvals },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-muted)]">{label}</p>
                <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* TODO (Siddhant): pending organizer approval table with approve button */}
        <pre className="bg-white border border-[var(--color-border)] rounded-xl p-4 text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}