import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TicketTierInputData } from '../../schemas/event.schema';

export interface TicketTierFormProps {
  tiers: TicketTierInputData[];
  onChange: (tiers: TicketTierInputData[]) => void;
  error?: string;
}

export const TicketTierForm: React.FC<TicketTierFormProps> = ({ tiers, onChange, error }) => {
  const addTier = () => {
    onChange([
      ...tiers,
      { name: '', description: '', price: '0', quantity: 100, display_order: tiers.length, is_active: true },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      onChange(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: keyof TicketTierInputData, value: unknown) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Ticket Tiers</h4>
          <p className="text-xs text-slate-500">Define pricing and quantities for your event</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addTier} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Tier
        </Button>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tier #{index + 1}
              </span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Tier Name"
                placeholder="e.g. VIP, Early Bird"
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
              />
              <Input
                label="Price (NPR)"
                type="number"
                step="0.01"
                placeholder="0"
                value={tier.price}
                onChange={(e) => updateTier(index, 'price', e.target.value)}
              />
              <Input
                label="Quantity"
                type="number"
                placeholder="100"
                value={tier.quantity}
                onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
