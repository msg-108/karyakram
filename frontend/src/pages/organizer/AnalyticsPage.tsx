import React from 'react';
import {
  useOrganizerRevenueAnalytics,
  useOrganizerTicketSalesSummary,
  useOrganizerCheckInStats,
} from '../../hooks/useOrganizer';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { Spinner } from '../../components/ui/Spinner';
import { Ticket, Users, DollarSign, Download } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { featureFlags } from '../../config/featureFlags';
import { useToast } from '../../context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const toast = useToast();
  const { data: revenueData, isLoading: revLoading } = useOrganizerRevenueAnalytics();
  const { data: ticketSales } = useOrganizerTicketSalesSummary();
  const { data: checkIns } = useOrganizerCheckInStats();

  if (revLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleExportReport = (reportType: string) => {
    if (!featureFlags.EXPORT_REPORTS_ENABLED) {
      toast.info(`CSV/PDF Export for "${reportType}" is coming soon.`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics & Reports</h1>
          <p className="text-xs text-slate-500">Track total sales, check-in attendance, and monthly revenue</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportReport('sales')}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export Sales CSV
        </Button>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gross Sales"
          value={formatCurrency(revenueData?.total_revenue || '0')}
          icon={DollarSign}
        />
        <StatCard
          title="Tickets Sold"
          value={`${ticketSales?.total_sold || 0} / ${ticketSales?.total_available || 0}`}
          icon={Ticket}
          subtitle="Available across all events"
        />
        <StatCard
          title="Attendees Checked In"
          value={`${checkIns?.total_checked_in || 0} / ${checkIns?.total_expected || 0}`}
          icon={Users}
          subtitle="Door check-in rate"
        />
      </div>

      <RevenueChart data={revenueData?.by_month || []} totalRevenue={revenueData?.total_revenue} />
    </div>
  );
};
