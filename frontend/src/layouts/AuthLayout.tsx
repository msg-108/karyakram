import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isOrganizerRegister = location.pathname.includes('/register/organizer');

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center bg-slate-950 p-2 sm:p-6 overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <Link to="/" className="mb-6 flex items-center gap-2.5 group relative z-10">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-black text-white tracking-tight font-heading">
          Karya<span className="text-gradient">kram</span>
        </span>
      </Link>

      {/* Auth Card Container (Decreased side margins for Organizer Register) */}
      <div className={`w-full ${isOrganizerRegister ? 'max-w-4xl lg:max-w-5xl' : 'max-w-md'} glass-panel rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-8 relative z-10 transition-all`}>
        <Outlet />
      </div>

      {/* Footer copyright */}
      <p className="mt-8 text-xs text-slate-500 relative z-10 font-medium">
        © {new Date().getFullYear()} Karyakram Inc. All rights reserved.
      </p>
    </div>
  );
};
