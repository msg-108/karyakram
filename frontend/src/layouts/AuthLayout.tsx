import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6">
      {/* Brand Header */}
      <Link to="/" className="mb-6 flex items-center gap-2.5 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
          <Calendar className="w-5 h-5" />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tight">Karyakram</span>
      </Link>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <Outlet />
      </div>

      {/* Footer copyright */}
      <p className="mt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} Karyakram Inc. All rights reserved.
      </p>
    </div>
  );
};
