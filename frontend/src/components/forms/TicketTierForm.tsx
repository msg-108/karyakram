import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TicketTierInputData } from '../../schemas/event.schema';

export interface TicketTierFormProps {
  tiers: TicketTierInputData[];
  onChange: (tiers: TicketTierInputData[]) => void;
  error?: any;
}

const getRootErrorMessage = (err: any): string | null => {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  if (typeof err.root?.message === 'string') return err.root.message;
  return null;
};

const getItemFieldError = (err: any, index: number, field: string): string | undefined => {
  if (!err) return undefined;
  if (Array.isArray(err) && err[index] && err[index][field]) {
    return err[index][field]?.message;
  }
  if (err[index] && err[index][field]) {
    return err[index][field]?.message;
  }
  return undefined;
};

export const TicketTierForm: React.FC<TicketTierFormProps> = ({ tiers, onChange, error }) => {
  const addTier = () => {
    onChange([
      ...tiers,
      {
        name: `Tier ${tiers.length + 1}`,
        description: '',
        price: '0',
        quantity: 100,
        display_order: tiers.length,
        is_active: true,
      },
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

  const adjustQuantity = (index: number, delta: number) => {
    const current = tiers[index].quantity || 0;
    const next = Math.max(0, current + delta);
    updateTier(index, 'quantity', next);
  };

  const rootErrorMsg = getRootErrorMessage(error);

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

      {rootErrorMsg && <p className="text-xs text-rose-600 font-bold">{rootErrorMsg}</p>}

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
                  title="Remove Tier"
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
                error={getItemFieldError(error, index, 'name')}
              />
              <Input
                label="Price (NPR)"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={tier.price}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateTier(index, 'price', isNaN(val) || val < 0 ? '0' : e.target.value);
                }}
                error={getItemFieldError(error, index, 'price')}
              />
              <div className="w-full space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
                  Quantity
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(index, -1)}
                    disabled={(tier.quantity || 0) <= 0}
                    className="w-10 h-[46px] flex items-center justify-center bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-700 font-bold transition-colors shrink-0"
                    title="Decrease Quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={tier.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateTier(index, 'quantity', isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="text-center"
                    error={getItemFieldError(error, index, 'quantity')}
                  />
                  <button
                    type="button"
                    onClick={() => adjustQuantity(index, 1)}
                    className="w-10 h-[46px] flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 font-bold transition-colors shrink-0"
                    title="Increase Quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
