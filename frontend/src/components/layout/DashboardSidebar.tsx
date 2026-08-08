import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  QrCode,
  BarChart3,
  Users,
  CheckSquare,
  Ticket,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';

export const DashboardSidebar: React.FC = () => {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOrganizer = user?.role === 'ORGANIZER';
  const isAdmin = isStaff;

  const attendeeNav = [
    { label: 'Profile', path: '/profile', icon: UserIcon },
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', path: '/my-bookings', icon: Calendar },
    { label: 'My Tickets', path: '/my-tickets', icon: Ticket },
  ];

  const organizerNav = [
    { label: 'Profile', path: '/organizer/profile', icon: UserIcon },
    { label: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
    { label: 'My Events', path: '/organizer/events', icon: Calendar },
    { label: 'Create Event', path: '/organizer/events/new', icon: PlusCircle },
    { label: 'QR Scanner', path: '/organizer/check-in', icon: QrCode },
    { label: 'Analytics', path: '/organizer/analytics', icon: BarChart3 },
  ];

  const adminNav = [
    { label: 'Profile', path: '/admin/profile', icon: UserIcon },
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Pending Organizers', path: '/admin/organizers/pending', icon: Users },
    { label: 'Pending Events', path: '/admin/events/pending', icon: CheckSquare },
  ];

  const currentNav = isAdmin ? adminNav : isOrganizer ? organizerNav : attendeeNav;

  return (
    <aside className="w-64 bg-karyakram-red-600 border-r border-karyakram-red-800 text-white flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* User Info Header */}
        <div className="p-3 bg-karyakram-red-800/80 rounded-xl border border-karyakram-red-200/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-karyakram-gold-600 text-karyakram-red-900 flex items-center justify-center font-extrabold text-sm shadow-xs">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">
              {user?.first_name} {user?.last_name}
            </h4>
            <p className="text-xs text-karyakram-red-200 font-semibold uppercase tracking-wider">
              {isAdmin ? 'System Admin' : user?.role}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/organizer/dashboard' || item.path === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-karyakram-red-800 text-white font-bold shadow-xs'
                      : 'text-karyakram-red-50 hover:bg-karyakram-red-800/60 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-karyakram-red-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-karyakram-gold-200 hover:bg-karyakram-red-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
