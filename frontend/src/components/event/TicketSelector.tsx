import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { TicketTier } from '../../types/event.types';
import { formatCurrency } from '../../lib/formatters';
import { Badge } from '../ui/Badge';

export interface SelectedTierItem {
  ticket_tier: number;
  ticket_tier_name: string;
  price: string;
  quantity: number;
}

export interface TicketSelectorProps {
  tiers: TicketTier[];
  selectedTiers: Record<number, number>; // tierId -> quantity
  onChange: (tierId: number, quantity: number) => void;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({ tiers, selectedTiers, onChange }) => {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
        No ticket tiers available for this event yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const qty = selectedTiers[tier.id] || 0;
        const isSoldOut = tier.remaining_quantity <= 0 || !tier.is_active;

        return (
          <div
            key={tier.id}
            className={`p-4 rounded-2xl border transition-all ${
              isSoldOut
                ? 'bg-slate-950/60 border-slate-800/60 opacity-50'
                : qty > 0
                ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Tier Info */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate font-heading">{tier.name}</h4>
                  {isSoldOut && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Sold Out
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-xs text-slate-400 line-clamp-1">{tier.description}</p>
                )}
                <p className="text-[11px] font-medium text-indigo-400">
                  {tier.remaining_quantity} remaining
                </p>
              </div>

              {/* Price & Counter */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-base font-extrabold text-white font-heading">
                  {formatCurrency(tier.price)}
                </span>

                <div className="flex items-center border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-inner">
                  <button
                    type="button"
                    disabled={qty <= 0 || isSoldOut}
                    onClick={() => onChange(tier.id, qty - 1)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-8 text-center text-xs font-bold text-white select-none">
                    {qty}
                  </span>

                  <button
                    type="button"
                    disabled={qty >= tier.remaining_quantity || isSoldOut}
                    onClick={() => onChange(tier.id, qty + 1)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
