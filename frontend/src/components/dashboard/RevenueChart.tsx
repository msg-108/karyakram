import React, { useState } from 'react';
import { RevenueByMonth } from '../../types/dashboard.types';
import { formatCurrency } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, TrendingUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface RevenueChartProps {
  data?: RevenueByMonth[];
  totalRevenue?: string;
  currency?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  totalRevenue = '0.00',
}) => {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState<'all' | '6m'>('all');

  const filteredData = timeRange === '6m' ? data.slice(-6) : data;
  const maxAmount = Math.max(...filteredData.map((d) => parseFloat(d.amount) || 0), 1);

  const handleExportCSV = () => {
    try {
      const headers = ['Month/Period', 'Revenue (NPR)', 'Percentage of Total'];
      const totalNum = parseFloat(totalRevenue) || 1;

      const rows = filteredData.map((d) => {
        const amt = parseFloat(d.amount) || 0;
        const pct = ((amt / totalNum) * 100).toFixed(1) + '%';
        return [`"${d.label}"`, amt.toFixed(2), `"${pct}"`].join(',');
      });

      const csvContent = [headers.join(','), ...rows, `\n"TOTAL REVENUE",${parseFloat(totalRevenue).toFixed(2)},"100%"`].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Karyakram_Revenue_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Analytics CSV report exported successfully!');
    } catch {
      toast.error('Failed to export CSV report.');
    }
  };

  return (
    <Card className="border border-slate-300 shadow-md bg-[#F3F4F6]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-karyakram-red-600" />
            <CardTitle className="text-base font-black text-slate-900 font-heading">Revenue Analytics & Growth</CardTitle>
          </div>
          <p className="text-xs text-slate-600 font-medium">Monthly gross sales and financial performance</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 border border-slate-300">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                timeRange === 'all' ? 'bg-karyakram-red-600 text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                timeRange === '6m' ? 'bg-karyakram-red-600 text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Last 6 Months
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs font-bold text-slate-900 border-slate-300 bg-white">
            <Download className="w-3.5 h-3.5 text-karyakram-red-600" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-300 text-xs">
          <div>
            <span className="text-slate-600 font-medium">Total Gross Sales</span>
            <p className="text-xl font-black text-emerald-700 font-heading">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <span className="text-slate-600 font-medium">Active Data Periods</span>
            <p className="text-sm font-bold text-slate-900 font-heading">{filteredData.length} Months</p>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-600 font-medium">
            No sales data recorded for this period yet.
          </div>
        ) : (
          <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-300">
            {filteredData.map((item, index) => {
              const amountNum = parseFloat(item.amount) || 0;
              const heightPercent = Math.max((amountNum / maxAmount) * 100, 6);

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-extrabold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                    {formatCurrency(amountNum)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[44px] bg-gradient-to-t from-karyakram-red-800 via-karyakram-red-600 to-karyakram-gold-600 rounded-t-lg group-hover:brightness-110 transition-all duration-200 shadow-sm"
                  />
                  <span className="text-[11px] font-bold text-slate-900 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
