import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, LogOut, Menu, X, PlusCircle, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const PublicNavbar: React.FC = () => {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-[100] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="container-app h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight font-heading">
            Karya<span className="text-gradient">kram</span>
          </span>
        </Link>

        {/* Enlarge Search Bar in Navbar */}
        <form onSubmit={handleNavSearchSubmit} className="hidden sm:flex items-center relative max-w-md lg:max-w-xl w-full mx-2 sm:mx-6">
          <input
            type="text"
            placeholder="Search events, concerts, tech summits, or cities..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/90 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium shadow-inner"
          />
          <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
        </form>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm font-semibold text-slate-300 hover:text-indigo-400 transition-colors">
            Browse Events
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'ORGANIZER' && (
                <Link to="/organizer/events/new">
                  <Button size="sm" className="gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 border-0">
                    <PlusCircle className="w-4 h-4" />
                    Create Event
                  </Button>
                </Link>
              )}

              {user?.role === 'USER' && (
                <Link to="/my-tickets" className="text-sm font-semibold text-slate-300 hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                  My Tickets
                </Link>
              )}

              <Link
                to={isStaff ? '/admin/dashboard' : user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard'}
                className="flex items-center gap-2.5 pl-3 border-l border-slate-800"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="text-sm font-semibold text-slate-200 hover:text-white transition-colors">{user?.first_name}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white"
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
