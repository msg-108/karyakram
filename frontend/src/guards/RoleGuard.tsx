import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RoleEnum } from '../types/common.types';
import { Spinner } from '../components/ui/Spinner';

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: RoleEnum[];
  requireStaff?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [],
  requireStaff = false,
}) => {
  const { user, isStaff, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role) && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
