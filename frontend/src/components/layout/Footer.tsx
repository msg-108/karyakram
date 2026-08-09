import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-karyakram-red-900 text-karyakram-red-200 border-t border-karyakram-red-800 py-8 transition-all">
      <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-black text-white tracking-tight font-heading">
            Karya<span className="text-karyakram-red-200">kram</span>
          </Link>
          <span className="text-karyakram-red-700 hidden sm:inline">|</span>
          <span className="text-karyakram-red-200 hidden sm:inline">
            Nepal's Unified Event Platform
          </span>
        </div>

        <div className="flex items-center gap-6 text-karyakram-red-100 font-semibold">
          <Link to="/events" className="hover:text-white transition-colors">
            Browse Events
          </Link>
          <Link to="/register/organizer" className="hover:text-white transition-colors">
            Host an Event
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
        </div>

        <div className="text-karyakram-red-300 text-[11px]">
          © {new Date().getFullYear()} Karyakram. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
