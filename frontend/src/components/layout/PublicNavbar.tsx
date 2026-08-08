import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, LogOut, Menu, X, PlusCircle, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const PublicNavbar: React.FC = () => {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isEventsListingPage = location.pathname === '/events';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/events?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  return (
    <nav className="sticky top-0 z-[100] bg-karyakram-red-600 text-white backdrop-blur-xl border-b border-karyakram-red-800 transition-all shadow-md">
      <div className="container-app h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Mix of white and red */}
        <Link to="/" className="flex items-center group shrink-0">
          <span className="text-2xl font-black tracking-tight font-heading group-hover:opacity-90 transition-opacity text-white">
            Karya<span className="text-karyakram-red-200">kram</span>
          </span>
        </Link>

        {/* Enlarge Search Bar in Navbar (Hidden on /events search page) */}
        {!isEventsListingPage && (
          <form onSubmit={handleNavSearchSubmit} className="hidden sm:flex items-center relative max-w-md lg:max-w-xl w-full mx-2 sm:mx-6">
            <input
              type="text"
              placeholder="Search events, concerts, tech summits, or cities..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-karyakram-red-800/80 border border-karyakram-red-200/30 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-karyakram-red-200 focus:outline-none focus:border-karyakram-gold-600 focus:ring-2 focus:ring-karyakram-gold-600/30 transition-all font-medium shadow-inner"
            />
            <Search className="w-4 h-4 text-karyakram-red-200 absolute left-3.5 pointer-events-none" />
          </form>
        )}

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm font-semibold text-karyakram-red-50 hover:text-white transition-colors">
            Browse Events
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'ORGANIZER' && (
                <Link to="/organizer/events/new">
                  <Button size="sm" className="gap-1.5 shadow-md border-0">
                    <PlusCircle className="w-4 h-4" />
                    Create Event
                  </Button>
                </Link>
              )}

              {!isStaff && user?.role === 'USER' && (
                <Link to="/my-tickets" className="text-sm font-semibold text-karyakram-red-50 hover:text-white flex items-center gap-1.5 transition-colors">
                  <Ticket className="w-4 h-4 text-karyakram-gold-200" />
                  My Tickets
                </Link>
              )}

              <Link
                to={isStaff ? '/admin/dashboard' : user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard'}
                className="flex items-center gap-2.5 pl-3 border-l border-karyakram-red-800"
              >
                <div className="w-9 h-9 rounded-xl bg-karyakram-red-50 text-karyakram-red-800 border border-karyakram-red-200 flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="text-sm font-semibold text-white hover:text-karyakram-gold-200 transition-colors">{user?.first_name}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-karyakram-red-200 hover:text-white hover:bg-karyakram-red-800 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-karyakram-red-50 hover:text-white hover:bg-karyakram-red-800">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-karyakram-red-200 hover:bg-karyakram-red-800 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-karyakram-red-800 bg-karyakram-red-600 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 shadow-lg">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-white hover:bg-karyakram-purple-800"
          >
            Browse Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={isStaff ? '/admin/dashboard' : user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-white hover:bg-karyakram-purple-800"
              >
                Dashboard
              </Link>
              {!isStaff && user?.role === 'USER' && (
                <Link
                  to="/my-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-medium text-white hover:bg-karyakram-purple-800"
                >
                  My Tickets
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-base font-medium text-karyakram-gold-200 hover:bg-karyakram-purple-800 cursor-pointer"
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
