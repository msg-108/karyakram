import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { queryKeys } from '../config/queryClient';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => notificationService.listNotifications(unreadOnly),
    refetchInterval: 60 * 1000, // Poll every minute
  });
}
