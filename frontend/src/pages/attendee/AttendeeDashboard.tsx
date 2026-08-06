import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { queryKeys } from '../../config/queryClient';
import { StatCard } from '../../components/dashboard/StatCard';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatDateTime } from '../../lib/formatters';

export const AttendeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.user.summary(),
    queryFn: () => dashboardService.getUserSummary(),
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.user.upcomingEvents(),
    queryFn: () => dashboardService.getUserUpcomingEvents(),
  });

  const { data: activity = [] } = useQuery({
    queryKey: queryKeys.user.recentActivity(),
    queryFn: () => dashboardService.getUserRecentActivity(),
  });

  if (summaryLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.first_name}!</h1>
        <p className="text-xs text-slate-500">Manage your active tickets and view recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Upcoming Tickets"
          value={summary?.upcoming_ticket_count || 0}
          icon={Ticket}
          subtitle="Events starting soon"
        />
        <StatCard
          title="Total Bookings"
          value={summary?.total_ticket_count || 0}
          icon={Calendar}
          subtitle="All-time booked tickets"
        />
        <StatCard
          title="Unread Notifications"
          value={summary?.unread_notification_count || 0}
          icon={Clock}
          subtitle="System updates"
        />
      </div>

      {/* Upcoming Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Booked Events</CardTitle>
              <Link to="/my-tickets" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Tickets →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No upcoming events booked yet.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.event_id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{evt.title}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{formatDateTime(evt.date_time)}</p>
                      <p className="text-xs text-slate-500 truncate">{evt.location}</p>
                    </div>
                    <Link to="/my-tickets">
                      <button className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        View QR Pass
                      </button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No recent activity.</p>
              ) : (
                <div className="space-y-3 border-l-2 border-slate-200 pl-4">
                  {activity.slice(0, 5).map((act, index) => (
                    <div key={index} className="space-y-0.5 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[21px] top-1" />
                      <p className="text-xs font-medium text-slate-800">{act.description}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(act.occurred_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
