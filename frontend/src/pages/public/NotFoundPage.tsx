import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-slate-200 space-y-6">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500">
          The page or event you requested does not exist or has been removed.
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
