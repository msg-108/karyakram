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
        <h1 className="text-2xl font-black text-slate-900 font-heading">Welcome, {user?.first_name}!</h1>
        <p className="text-xs text-slate-600 font-medium">Manage your active tickets and view recent activity</p>
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
          <Card className="border border-slate-300 shadow-md">
            <CardHeader className="flex items-center justify-between border-b border-slate-300">
              <CardTitle className="text-base font-black text-slate-900 font-heading">Upcoming Booked Events</CardTitle>
              <Link to="/my-tickets" className="text-xs font-bold text-slate-900 hover:text-karyakram-red-600 hover:underline">
                View Tickets →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-600 py-6 text-center font-medium">No upcoming events booked yet.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.event_id}
                    className="p-4 bg-[#F3F4F6] border border-slate-300 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate">{evt.title}</h4>
                      <p className="text-xs text-slate-900 font-bold">{formatDateTime(evt.date_time)}</p>
                      <p className="text-xs text-slate-600 truncate">{evt.location}</p>
                    </div>
                    <Link to="/my-tickets">
                      <button className="px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs font-bold hover:bg-karyakram-red-600 hover:text-white transition-colors cursor-pointer">
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
          <Card className="border border-slate-300 shadow-md">
            <CardHeader className="border-b border-slate-300">
              <CardTitle className="text-base font-black text-slate-900 font-heading">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {activity.length === 0 ? (
                <p className="text-xs text-slate-600 py-6 text-center font-medium">No recent activity.</p>
              ) : (
                <div className="space-y-3 border-l-2 border-slate-300 pl-4">
                  {activity.slice(0, 5).map((act, index) => (
                    <div key={index} className="space-y-0.5 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-karyakram-red-600 absolute -left-[21px] top-1" />
                      <p className="text-xs font-bold text-slate-900">{act.description}</p>
                      <p className="text-[10px] text-slate-600 font-medium">{formatDateTime(act.occurred_at)}</p>
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
