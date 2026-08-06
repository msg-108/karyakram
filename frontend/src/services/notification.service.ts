import { api } from '../lib/api';
import { NotificationSummary } from '../types/dashboard.types';

export const notificationService = {
  async listNotifications(unreadOnly = false): Promise<NotificationSummary[]> {
    const res = await api.get<NotificationSummary[]>('/dashboard/notifications/', {
      params: { unread_only: unreadOnly },
    });
    return res.data;
  },
};
