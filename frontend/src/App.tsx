import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Guards
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { ApprovalGuard } from './guards/ApprovalGuard';
import { GuestRoute } from './guards/GuestRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { EventListingPage } from './pages/public/EventListingPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterUserPage } from './pages/auth/RegisterUserPage';
import { RegisterOrganizerPage } from './pages/auth/RegisterOrganizerPage';
import { VerifyOTPPage } from './pages/auth/VerifyOTPPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Attendee Pages
import { AttendeeDashboard } from './pages/attendee/AttendeeDashboard';
import { MyBookingsPage } from './pages/attendee/MyBookingsPage';
import { MyTicketsPage } from './pages/attendee/MyTicketsPage';
import { CheckoutPage } from './pages/attendee/CheckoutPage';
import { PaymentCallbackPage } from './pages/attendee/PaymentCallbackPage';

// Organizer Pages
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { EditEventPage } from './pages/organizer/EditEventPage';
import { EventAttendeesPage } from './pages/organizer/EventAttendeesPage';
import { AnalyticsPage } from './pages/organizer/AnalyticsPage';
import { QRScannerPage } from './pages/organizer/QRScannerPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PendingOrganizersPage } from './pages/admin/PendingOrganizersPage';
import { PendingEventsPage } from './pages/admin/PendingEventsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public Routes (Navbar + Footer) ─── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventListingPage />} />
          <Route path="/events/:slug" element={<EventDetailPage />} />
        </Route>

        {/* ─── Guest Only Routes (Auth Centered Cards) ─── */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterUserPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register/organizer"
            element={
              <GuestRoute>
                <RegisterOrganizerPage />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOTPPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPasswordPage />
              </GuestRoute>
            }
          />
        </Route>

        {/* ─── Dashboard Routes (Sidebar + Content) ─── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Attendee */}
          <Route path="/dashboard" element={<AttendeeDashboard />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />

          {/* Organizer */}
          <Route
            path="/organizer/dashboard"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <OrganizerDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <OrganizerEventsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/events/new"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <ApprovalGuard>
                  <CreateEventPage />
                </ApprovalGuard>
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/events/:id/edit"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <EditEventPage />
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/events/:id/attendees"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <EventAttendeesPage />
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/analytics"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <AnalyticsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/organizer/check-in"
            element={
              <RoleGuard allowedRoles={['ORGANIZER']}>
                <QRScannerPage />
              </RoleGuard>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleGuard requireStaff={true}>
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/organizers/pending"
            element={
              <RoleGuard requireStaff={true}>
                <PendingOrganizersPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/events/pending"
            element={
              <RoleGuard requireStaff={true}>
                <PendingEventsPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* ─── Fallbacks ─── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
