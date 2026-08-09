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
  const [selected] = useState<ProviderEnum>('ESEWA');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSelectProvider(selected);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40">
      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-karyakram-red-600" />
          Select Payment Method
        </h3>
        <p className="text-xs text-slate-500">All payments are processed securely via eSewa</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* eSewa Clickable Card */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isLoading}
          className="p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 active:scale-[0.99] flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md group-hover:scale-105 transition-transform">
              eS
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">eSewa Mobile Wallet</h4>
              <p className="text-xs font-medium text-emerald-800">Click to Pay via Official eSewa Gateway</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/80 px-3 py-1.5 rounded-full border border-emerald-300">
            Selected ✓
          </span>
        </button>
      </div>

      <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Instant ticket issuance upon successful eSewa payment verification.</span>
      </div>

      <Button
        type="button"
        onClick={() => handleSubmit()}
        isLoading={isLoading}
        className="w-full py-4 text-base font-bold border-0 shadow-md shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl cursor-pointer transition-all"
      >
        {isLoading ? 'Redirecting to eSewa...' : 'Proceed with eSewa Payment →'}
      </Button>
    </div>
  );
};
