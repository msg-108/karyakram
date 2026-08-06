import React from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckSquare, ShieldCheck } from 'lucide-react';
import { usePendingOrganizers, usePendingEvents } from '../../hooks/useAdmin';
import { StatCard } from '../../components/dashboard/StatCard';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const AdminDashboard: React.FC = () => {
  const { data: pendingOrgs = [], isLoading: orgsLoading } = usePendingOrganizers();
  const { data: pendingEvents = [], isLoading: eventsLoading } = usePendingEvents();

  if (orgsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Admin Control Panel</h1>
        <p className="text-xs text-slate-500">System metrics and pending approval queues</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Organizers"
          value={pendingOrgs.length}
          icon={Users}
          subtitle="Verification requests"
        />
        <StatCard
          title="Pending Events"
          value={pendingEvents.length}
          icon={CheckSquare}
          subtitle="Submitted for review"
        />
        <StatCard
          title="System Status"
          value="Healthy"
          icon={ShieldCheck}
          subtitle="API & Services online"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Organizers</CardTitle>
            <Link to="/admin/organizers/pending" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All ({pendingOrgs.length}) →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingOrgs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending organizer applications.</p>
            ) : (
              pendingOrgs.slice(0, 3).map((org) => (
                <div key={org.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{org.organization_name}</h4>
                    <p className="text-[10px] text-slate-500">{org.user.email}</p>
                  </div>
                  <Link to="/admin/organizers/pending">
                    <button className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium">
                      Review
                    </button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Events</CardTitle>
            <Link to="/admin/events/pending" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All ({pendingEvents.length}) →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No submitted events awaiting review.</p>
            ) : (
              pendingEvents.slice(0, 3).map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-[10px] text-slate-500">By {evt.organizer_name}</p>
                  </div>
                  <Link to="/admin/events/pending">
                    <button className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium">
                      Review
                    </button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
