import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertOctagon, RefreshCw, Ticket as TicketIcon } from 'lucide-react';
import { useVerifyPayment } from '../../hooks/useBookings';
import { ProviderEnum } from '../../types/common.types';
import { SESSION_KEYS } from '../../config/constants';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyMutation = useVerifyPayment();
  const hasTriggeredRef = useRef(false);

  // Parse callback params (Khalti uses pidx, eSewa uses refId)
  const pidx = searchParams.get('pidx') || searchParams.get('refId') || '';
  const provider = (searchParams.get('provider') || sessionStorage.getItem(SESSION_KEYS.PAYMENT_PROVIDER) || 'KHALTI') as ProviderEnum;

  const bookingIdStr = searchParams.get('booking_id') || sessionStorage.getItem(SESSION_KEYS.PENDING_BOOKING_ID);
  const bookingId = bookingIdStr ? parseInt(bookingIdStr, 10) : null;

  useEffect(() => {
    if (bookingId && !hasTriggeredRef.current && !verifyMutation.isSuccess && !verifyMutation.isPending) {
      hasTriggeredRef.current = true;
      verifyMutation.mutate({
        bookingId,
        data: { provider, pidx: pidx || undefined },
      });
    }
  }, [bookingId, provider, pidx, verifyMutation]);

  const handleRetry = () => {
    if (bookingId) {
      verifyMutation.mutate({
        bookingId,
        data: { provider, pidx: pidx || undefined },
      });
    }
  };

  const handleFinish = () => {
    sessionStorage.removeItem(SESSION_KEYS.PENDING_BOOKING_ID);
    sessionStorage.removeItem(SESSION_KEYS.PAYMENT_PROVIDER);
    navigate('/my-tickets');
  };

  return (
    <div className="container-app py-16 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6">
        {verifyMutation.isPending && (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Verifying Payment...</h2>
            <p className="text-xs text-slate-500">Please do not refresh or close this tab.</p>
          </div>
        )}

        {verifyMutation.isSuccess && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Payment Verified!</h2>
              <p className="text-xs text-slate-500">
                Your booking is confirmed and your tickets have been generated.
              </p>
            </div>
            <Button size="lg" onClick={handleFinish} className="w-full gap-2">
              <TicketIcon className="w-5 h-5" />
              View My Tickets & QR Passes
            </Button>
          </div>
        )}

        {verifyMutation.isError && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertOctagon className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-rose-600">
                {(verifyMutation.error as Error)?.message || 'Could not verify payment with the gateway.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="flex-1 gap-1">
                <RefreshCw className="w-4 h-4" />
                Retry Verify
              </Button>

              <Button variant="secondary" onClick={() => navigate('/events')} className="flex-1">
                Browse Events
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
