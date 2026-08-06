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
    <Card className="hover:border-slate-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend && <p className="text-xs font-semibold text-emerald-600">{trend}</p>}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
};
