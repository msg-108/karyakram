import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle, trend }) => {
  return (
    <Card className="hover:border-karyakram-purple-200 shadow-xl shadow-slate-200/40">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-karyakram-purple-900 font-heading tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          {trend && <p className="text-xs font-semibold text-karyakram-purple-800">{trend}</p>}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-karyakram-purple-50 text-karyakram-purple-800 border border-karyakram-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs">
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
};
