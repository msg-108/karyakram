import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer } from '../components/layout/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 font-sans">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
