import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />
      <div className="flex-1 flex container-app py-6 gap-6">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
