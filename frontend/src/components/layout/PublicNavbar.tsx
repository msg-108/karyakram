import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const PublicNavbar: React.FC = () => {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="container-app h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">Karyakram</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Browse Events
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'ORGANIZER' && (
                <Link to="/organizer/events/new">
                  <Button size="sm" variant="outline" className="gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <PlusCircle className="w-4 h-4" />
                    Create Event
                  </Button>
                </Link>
              )}

              {user?.role === 'USER' && (
                <Link to="/my-tickets" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-indigo-600" />
                  My Tickets
                </Link>
              )}

              <Link
                to={isStaff ? '/admin/dashboard' : user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard'}
                className="flex items-center gap-2 pl-3 border-l border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="text-sm font-semibold text-slate-800">{user?.first_name}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={isStaff ? '/admin/dashboard' : user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              {user?.role === 'USER' && (
                <Link
                  to="/my-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Tickets
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
