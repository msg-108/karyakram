import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export const ApprovalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isApproved, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user is an organizer but not yet approved by admin
  if (user?.role === 'ORGANIZER' && !isApproved) {
    return (
      <div className="container-app py-12">
        <Card className="max-w-xl mx-auto border-amber-200 bg-amber-50/50">
          <CardContent className="space-y-4 text-center p-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Organizer Account Pending Approval</h2>
              <p className="text-sm text-slate-600">
                Your email is verified! However, your organizer account and verification documents are currently under review by our administrators.
              </p>
            </div>
            <div className="p-4 bg-amber-100/60 rounded-xl text-xs text-amber-900 text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                You can browse your dashboard and draft events, but submitting events for public review requires account approval.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
