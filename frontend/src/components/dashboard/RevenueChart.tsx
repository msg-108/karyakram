import React from 'react';
import { RevenueByMonth } from '../../types/dashboard.types';
import { formatCurrency } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface RevenueChartProps {
  data?: RevenueByMonth[];
  totalRevenue?: string;
  currency?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  totalRevenue = '0.00',
}) => {
  const maxAmount = Math.max(...data.map((d) => parseFloat(d.amount) || 0), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revenue Breakdown</CardTitle>
          <p className="text-xs text-slate-500">Monthly gross sales analytics</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
          <p className="text-lg font-black text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">
            No sales data recorded yet.
          </div>
        ) : (
          <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100">
            {data.map((item, index) => {
              const amountNum = parseFloat(item.amount) || 0;
              const heightPercent = Math.max((amountNum / maxAmount) * 100, 4);

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(amountNum)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all duration-200"
                  />
                  <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">
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
