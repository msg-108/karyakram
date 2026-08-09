import React from 'react';
import { cn } from '../../lib/cn';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
              isActive
                ? 'border-karyakram-purple-600 text-karyakram-purple-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  isActive ? 'bg-karyakram-purple-50 text-karyakram-purple-800' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
