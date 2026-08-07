import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, PlusCircle, QrCode, DollarSign, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useOrganizerDashboardSummary,
  useOrganizerRecentOrders,
  useOrganizerRevenueAnalytics,
} from '../../hooks/useOrganizer';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { OrderSummary } from '../../types/dashboard.types';

export const OrganizerDashboard: React.FC = () => {
  const { user, isApproved } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useOrganizerDashboardSummary();
  const { data: orders = [], isLoading: ordersLoading } = useOrganizerRecentOrders();
  const { data: revenueData } = useOrganizerRevenueAnalytics();

  if (summaryLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const orderColumns: Column<OrderSummary>[] = [
    { header: 'Order ID', accessor: (row) => `#${row.order_id}` },
    { header: 'Buyer Name', accessor: (row) => <span className="font-semibold">{row.buyer_name}</span> },
    { header: 'Event', accessor: (row) => <span className="truncate max-w-[180px] block">{row.event_name}</span> },
    { header: 'Amount', accessor: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount)}</span> },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', accessor: (row) => formatDateTime(row.placed_at) },
  ];

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Organizer Dashboard</h1>
          <p className="text-xs text-slate-600 font-medium">Welcome, {user?.first_name}! Overview of your events and sales</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/organizer/check-in">
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="w-4 h-4" />
              Scan Tickets
            </Button>
          </Link>
          <Link to="/organizer/events/new">
            <Button size="sm" disabled={!isApproved} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Events"
          value={summary?.total_events || 0}
          icon={Calendar}
          subtitle={`${summary?.upcoming_events || 0} upcoming`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueData?.total_revenue || '0')}
          icon={DollarSign}
          subtitle="Gross sales"
        />
        <StatCard
          title="Notifications"
          value={summary?.unread_notification_count || 0}
          icon={Bell}
          subtitle="Unread system updates"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenueData?.by_month || []} totalRevenue={revenueData?.total_revenue} />

      {/* Recent Orders */}
      <DataTable
        title="Recent Ticket Orders"
        columns={orderColumns}
        data={orders}
        keyExtractor={(row) => row.order_id}
        emptyText="No recent ticket orders recorded."
      />
    </div>
  );
};
