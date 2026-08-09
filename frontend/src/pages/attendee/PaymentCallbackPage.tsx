import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertOctagon, RefreshCw, Ticket as TicketIcon, XCircle } from 'lucide-react';
import { useVerifyPayment } from '../../hooks/useBookings';
import { useToast } from '../../context/ToastContext';
import { ProviderEnum } from '../../types/common.types';
import { SESSION_KEYS } from '../../config/constants';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
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
    const targetId = bookingId || 0;
    if (!hasTriggeredRef.current && !verifyMutation.isSuccess && !verifyMutation.isPending) {
      hasTriggeredRef.current = true;
      verifyMutation.mutate({
        bookingId: targetId,
        data: {
          provider,
          pidx: esewaData || undefined,
        },
      });
    }
  }, [bookingId, provider, esewaData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect to My Bookings upon successful verification after 3s
  useEffect(() => {
    if (verifyMutation.isSuccess) {
      const timer = setTimeout(() => {
        handleFinish(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [verifyMutation.isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect to My Bookings upon failure/error after 4s
  useEffect(() => {
    if (!verifyMutation.isPending && (isFailed || verifyMutation.isError)) {
      const timer = setTimeout(() => {
        handleFinish(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [verifyMutation.isPending, isFailed, verifyMutation.isError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety fallback: If verification stays pending > 8 seconds, force finish/retry
  useEffect(() => {
    if (verifyMutation.isPending) {
      const timer = setTimeout(() => {
        if (!verifyMutation.isSuccess) {
          handleFinish(false);
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [verifyMutation.isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    hasTriggeredRef.current = false;
    verifyMutation.mutate({
      bookingId: bookingId || 0,
      data: { provider, pidx: esewaData || undefined },
    });
  };

  const handleFinish = (success = true) => {
    sessionStorage.removeItem(SESSION_KEYS.PENDING_BOOKING_ID);
    sessionStorage.removeItem(SESSION_KEYS.PAYMENT_PROVIDER);
    if (success) {
      toast.success('Payment verified! Your booking is confirmed.');
      navigate('/my-bookings', {
        state: {
          paymentStatus: 'success',
          message: 'Payment verified! Your booking has been confirmed and tickets issued.',
        },
      });
    } else {
      toast.error('Payment was not completed or rejected.');
      navigate('/my-bookings', {
        state: {
          paymentStatus: 'rejected',
          message: 'Payment was not completed or was rejected by the gateway.',
        },
      });
    }
  };

  return (
    <div className="container-app py-16 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6">

        {/* 1. Success (Highest Priority) */}
        {verifyMutation.isSuccess && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 font-heading">Payment Verified!</h2>
              <p className="text-xs text-slate-500">
                Your booking is confirmed and your tickets have been generated.
              </p>
            </div>
            <Button size="lg" onClick={() => handleFinish(true)} className="w-full gap-2">
              <TicketIcon className="w-5 h-5" />
              View My Tickets &amp; QR Passes
            </Button>
          </div>
        )}

        {/* 2. Pending Verification */}
        {!verifyMutation.isSuccess && verifyMutation.isPending && (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">Verifying Payment...</h2>
            <p className="text-xs text-slate-500">Please do not refresh or close this tab.</p>
          </div>
        )}

        {/* 3. Explicit eSewa failure or verification error */}
        {!verifyMutation.isSuccess && !verifyMutation.isPending && (isFailed || verifyMutation.isError) && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 font-heading">Payment Failed</h2>
              <p className="text-xs text-rose-600">
                {(verifyMutation.error as Error)?.message || 'eSewa reported that the payment was not completed. No charge was made.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="flex-1 gap-1 text-xs">
                <RefreshCw className="w-4 h-4" />
                Retry Verify
              </Button>
              <Button variant="secondary" onClick={() => navigate('/events')} className="flex-1 text-xs">
                Browse Events
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
