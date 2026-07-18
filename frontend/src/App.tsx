import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPage from './pages/auth/VerifyPage'
import UserDashboard from './pages/dashboard/UserDashboard'
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import EventsListPage from './pages/events/EventsListPage'
import EventDetailPage from './pages/events/EventDetailPage'
import BookTicketsPage from './pages/bookings/BookTicketsPage'
import BookingConfirmationPage from './pages/bookings/BookingConfirmationPage'
import CreateEventPage from './pages/events/CreateEventPage'
import useAuthStore from './store/authStore'

/**
 * Resolves which dashboard component to render for /dashboard.
 *
 * Priority: isStaff → AdminDashboard (Django staff, not role-based)
 *           role === "ORGANIZER" → OrganizerDashboard
 *           else → UserDashboard (role === "USER" or unknown)
 *
 * isStaff is decoded from the JWT claim added by UserTokenObtainPairSerializer.
 * Role strings are uppercase — matching User.Role choices in the real backend.
 * The old code compared against "organizer" (lowercase) which always returned false.
 */
function DashboardRouter() {
  const { isStaff, role } = useAuthStore()

  if (isStaff) return <AdminDashboard />
  if (role === 'ORGANIZER') return <OrganizerDashboard />
  return <UserDashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<EventsListPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:slug/book"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <BookTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id/confirmation"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <BookingConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/create"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center text-[var(--color-text)]">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <a
                  href="/login"
                  className="text-[var(--color-primary-500)] hover:underline"
                >
                  Back to login
                </a>
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
