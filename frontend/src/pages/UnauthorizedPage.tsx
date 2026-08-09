import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-slate-200 space-y-6">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">403 - Access Denied</h1>
        <p className="text-sm text-slate-500">
          You don't have the required role or permissions to access this dashboard.
        </p>
      </div>
      <Link to="/" className="block">
        <Button className="w-full gap-2 justify-center">
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  </div>
);
