import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import UserDashboard from './pages/dashboard/UserDashboard'
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import useAuthStore from './store/authStore'

function DashboardRouter() {
  const { user } = useAuthStore()
  if (user?.is_staff || user?.is_superuser) return <AdminDashboard />
  if (user?.role === 'organizer') return <OrganizerDashboard />
  return <UserDashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — role resolved inside DashboardRouter */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center text-[var(--color-text)]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <a href="/login" className="text-[var(--color-primary-500)] hover:underline">Back to login</a>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}