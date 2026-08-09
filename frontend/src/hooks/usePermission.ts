import { useAuth } from './useAuth';

export function usePermission() {
  const { user, isStaff, isAuthenticated, isApproved } = useAuth();

  return {
    isAuthenticated,
    isStaff,
    isAttendee: user?.role === 'USER',
    isOrganizer: user?.role === 'ORGANIZER',
    isApprovedOrganizer: user?.role === 'ORGANIZER' && isApproved,
    isPendingOrganizer: user?.role === 'ORGANIZER' && !isApproved,
    
    // Fine-grained action checks
    canBookTickets: isAuthenticated && (user?.role === 'USER' || user?.role === 'ORGANIZER'),
    canCreateEvent: isAuthenticated && user?.role === 'ORGANIZER' && isApproved,
    canManageOwnEvents: isAuthenticated && user?.role === 'ORGANIZER',
    canCheckInAttendees: isAuthenticated && user?.role === 'ORGANIZER',
    canApproveOrganizers: isAuthenticated && isStaff,
    canApproveEvents: isAuthenticated && isStaff,
    canPublishEvents: isAuthenticated && isStaff,
  };
}
