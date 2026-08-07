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
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
        No ticket tiers available for this event yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const qty = selectedTiers[tier.id] || 0;
        const isSoldOut = tier.remaining_quantity <= 0 || !tier.is_active;
        const isLimited = tier.remaining_quantity > 0 && tier.remaining_quantity <= 10;

        return (
          <div
            key={tier.id}
            className={`p-4 rounded-2xl border transition-all ${
              isSoldOut
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : qty > 0
                ? 'bg-karyakram-purple-50/40 border-2 border-karyakram-purple-600 shadow-md shadow-karyakram-purple-600/10'
                : 'bg-white border-slate-200 hover:border-karyakram-purple-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Tier Info */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate font-heading">{tier.name}</h4>
                  {isSoldOut && (
                    <span className="badge-red">
                      Sold Out
                    </span>
                  )}
                  {isLimited && (
                    <span className="badge-gold">
                      Limited
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{tier.description}</p>
                )}
                <p className="text-[11px] font-semibold text-karyakram-purple-800">
                  {tier.remaining_quantity} remaining
                </p>
              </div>

              {/* Price & Counter */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-base font-black text-slate-900 font-heading">
                  {formatCurrency(tier.price)}
                </span>

                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    disabled={qty <= 0 || isSoldOut}
                    onClick={() => onChange(tier.id, qty - 1)}
                    className="p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-8 text-center text-xs font-bold text-slate-900 select-none">
                    {qty}
                  </span>

                  <button
                    type="button"
                    disabled={qty >= tier.remaining_quantity || isSoldOut}
                    onClick={() => onChange(tier.id, qty + 1)}
                    className="p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
