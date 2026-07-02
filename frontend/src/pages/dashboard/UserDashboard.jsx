// src/pages/dashboard/UserDashboard.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function UserDashboard() {
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
              Welcome, {user?.first_name}
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

        {/* TODO (Siddhant): flesh out with real dashboard sections */}
        <pre className="bg-white border border-[var(--color-border)] rounded-xl p-4 text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}