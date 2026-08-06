import React, { useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { ProviderEnum } from '../../types/common.types';
import { featureFlags } from '../../config/featureFlags';
import { Button } from '../ui/Button';

export interface PaymentPanelProps {
  onSelectProvider: (provider: ProviderEnum) => void;
  isLoading?: boolean;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  onSelectProvider,
  isLoading = false,
}) => {
  const [selected, setSelected] = useState<ProviderEnum>('KHALTI');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectProvider(selected);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          Select Payment Method
        </h3>
        <p className="text-xs text-slate-500">All payments are encrypted and processed securely</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Khalti */}
        {featureFlags.PAYMENT_KHALTI_ENABLED && (
          <button
            type="button"
            onClick={() => setSelected('KHALTI')}
            className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              selected === 'KHALTI'
                ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0">
              K
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Khalti Wallet</h4>
              <p className="text-xs text-slate-500">Pay via Khalti SDK/Web</p>
            </div>
          </button>
        )}

        {/* eSewa */}
        {featureFlags.PAYMENT_ESEWA_ENABLED && (
          <button
            type="button"
            onClick={() => setSelected('ESEWA')}
            className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              selected === 'ESEWA'
                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
              eS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">eSewa Mobile</h4>
              <p className="text-xs text-slate-500">Pay via eSewa ePay</p>
            </div>
          </button>
        )}
      </div>

      <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Instant ticket issuance upon successful payment verification.</span>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full py-3.5 text-base">
        Proceed with {selected}
      </Button>
    </form>
  );
};
