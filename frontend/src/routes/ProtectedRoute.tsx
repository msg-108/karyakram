/**
 * routes/ProtectedRoute.tsx
 *
 * Guards a route by checking:
 *  1. refreshToken exists (user is logged in at all)
 *  2. If allowedRoles is provided, role matches one of them
 *
 * Role strings are uppercase ("USER", "ORGANIZER") — matching the real
 * backend User.Role choices. The old code compared against lowercase strings
 * which always failed.
 *
 * role is read directly from authStore (decoded from JWT at login) — not from
 * a user object or a separate API call.
 */
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Uppercase role strings: "USER" | "ORGANIZER". Omit to allow any authenticated user. */
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { refreshToken, role, isStaff } = useAuthStore()

  if (!refreshToken) {
    return <Navigate to="/login" replace />
  }

  if (isStaff && allowedRoles?.includes('USER')) {
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role ?? '')) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
