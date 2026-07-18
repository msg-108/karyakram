import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function PublicNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const { accessToken, logout } = useAuthStore()

  return (
    <nav className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <span
          onClick={() => navigate('/')}
          className="text-[var(--color-primary-500)] font-bold text-lg tracking-tight cursor-pointer select-none"
        >
          Karyakram
        </span>

        {/* Right side navigation items */}
        <div className="flex items-center gap-4">
          {accessToken ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : path === '/login' ? (
            <button
              onClick={() => navigate('/register')}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-white
                         bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                         rounded-lg transition-colors cursor-pointer"
            >
              Register
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-sm font-medium
                         text-[var(--color-primary-500)] border border-[var(--color-primary-500)]
                         hover:bg-[var(--color-primary-50)] rounded-lg transition-colors cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
