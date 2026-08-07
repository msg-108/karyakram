import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertOctagon, RefreshCw, Ticket as TicketIcon, XCircle } from 'lucide-react';
import { useVerifyPayment } from '../../hooks/useBookings';
import { ProviderEnum } from '../../types/common.types';
import { SESSION_KEYS } from '../../config/constants';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pathParams = useParams<{ bookingId?: string; provider?: string }>();
  const verifyMutation = useVerifyPayment();
  const hasTriggeredRef = useRef(false);

  // ─── Resolve bookingId ──────────────────────────────────────────────────────
  // Priority: path param → query param → sessionStorage
  const bookingIdStr =
    pathParams.bookingId ||
    searchParams.get('booking_id') ||
    sessionStorage.getItem(SESSION_KEYS.PENDING_BOOKING_ID);
  const bookingId = bookingIdStr ? parseInt(bookingIdStr, 10) : null;

  // ─── Resolve provider ───────────────────────────────────────────────────────
  // Priority: path param → query param (stripped of contamination) → sessionStorage
  const rawProviderQS = searchParams.get('provider') || '';
  // Defensive strip: eSewa sometimes appends "?data=..." directly to the provider value
  // (e.g. "ESEWA?data=eyJ...") when the callback URL already had query params.
  const cleanProviderQS = rawProviderQS.split('?')[0];
  const provider = (
    pathParams.provider ||
    cleanProviderQS ||
    sessionStorage.getItem(SESSION_KEYS.PAYMENT_PROVIDER) ||
    'ESEWA'
  ).toUpperCase() as ProviderEnum;

  // ─── Resolve eSewa data token ───────────────────────────────────────────────
  // eSewa appends ?data=<base64> to the success_url.
  // If the callback URL had existing query params, eSewa used ? instead of &,
  // producing a URL like: /callback?booking_id=25&provider=ESEWA?data=eyJ...
  // In that broken case URLSearchParams won't see "data" at all, so we fall back
  // to extracting it from the raw location.search string.
  const esewaData =
    searchParams.get('data') ||
    (() => {
      const raw = window.location.search + window.location.href.split('?').slice(2).join('?');
      const dataMatch = raw.match(/[?&]data=([^&]+)/);
      return dataMatch ? dataMatch[1] : null;
    })();

  // ─── Resolve status / failure ───────────────────────────────────────────────
  const urlStatus = searchParams.get('status') || '';
  const isFailed = urlStatus.toLowerCase() === 'failed' || urlStatus.toLowerCase() === 'failure';

  // ─── Trigger verification once ─────────────────────────────────────────────
  useEffect(() => {
    if (isFailed) return;
    if (bookingId && !hasTriggeredRef.current && !verifyMutation.isSuccess && !verifyMutation.isPending) {
      hasTriggeredRef.current = true;
      verifyMutation.mutate({
        bookingId,
        data: {
          provider,
          // Pass the base64 data token if present; backend will use it to verify
          pidx: esewaData || undefined,
        },
      });
    }
  }, [bookingId, provider, esewaData, isFailed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    if (bookingId) {
      hasTriggeredRef.current = false;
      verifyMutation.mutate({
        bookingId,
        data: { provider, pidx: esewaData || undefined },
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

        {/* eSewa explicitly returned failure */}
        {isFailed && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Payment Failed</h2>
              <p className="text-xs text-rose-600">
                eSewa reported that the payment was not completed. No charge was made.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(`/checkout`)} className="flex-1 gap-1">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => navigate('/events')} className="flex-1">
                Browse Events
              </Button>
            </div>
          </div>
        )}

        {/* Verifying */}
        {!isFailed && verifyMutation.isPending && (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Verifying Payment...</h2>
            <p className="text-xs text-slate-500">Please do not refresh or close this tab.</p>
          </div>
        )}

        {/* Initial state (not yet started) */}
        {!isFailed && !verifyMutation.isPending && !verifyMutation.isSuccess && !verifyMutation.isError && (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Processing...</h2>
            <p className="text-xs text-slate-500">Confirming your payment with eSewa.</p>
          </div>
        )}

        {/* Success */}
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
              View My Tickets &amp; QR Passes
            </Button>
          </div>
        )}

        {/* Error */}
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
