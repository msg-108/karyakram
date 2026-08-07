import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isOrganizerRegister = location.pathname.includes('/register/organizer');

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center bg-[#FAFAFA] p-2 sm:p-6 overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-karyakram-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-karyakram-gold-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header Logo - Mix of slate and red */}
      <Link to="/" className="mb-6 flex items-center group relative z-10">
        <span className="text-3xl font-black text-slate-900 tracking-tight font-heading group-hover:opacity-90 transition-opacity">
          Karya<span className="text-karyakram-red-600 font-black">kram</span>
        </span>
      </Link>

      {/* Auth Card Container (Slightly darker white section over off-white background with darker border) */}
      <div className={`w-full ${isOrganizerRegister ? 'max-w-4xl lg:max-w-5xl' : 'max-w-md'} bg-[#F3F4F6] rounded-3xl border border-slate-300 shadow-xl p-4 sm:p-8 relative z-10 transition-all`}>
        <Outlet />
      </div>

      {/* Footer copyright */}
      <p className="mt-8 text-xs text-slate-500 relative z-10 font-medium">
        © {new Date().getFullYear()} Karyakram Inc. All rights reserved.
      </p>
    </div>
  );
};
