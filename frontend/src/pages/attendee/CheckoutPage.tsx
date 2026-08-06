import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../../services/booking.service';
import { useInitiatePayment } from '../../hooks/useBookings';
import { ProviderEnum } from '../../types/common.types';
import { SESSION_KEYS } from '../../config/constants';
import { BookingSummary } from '../../components/booking/BookingSummary';
import { PaymentPanel } from '../../components/booking/PaymentPanel';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const initiatePaymentMutation = useInitiatePayment();

  const [bookingId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem(SESSION_KEYS.PENDING_BOOKING_ID);
    return saved ? parseInt(saved, 10) : null;
  });

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking-pending', bookingId],
    queryFn: () => bookingService.getBooking(bookingId!),
    enabled: Boolean(bookingId),
  });

  useEffect(() => {
    if (!bookingId) {
      toast.warning('No active booking session. Please select tickets first.');
      navigate('/events');
    }
  }, [bookingId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container-app py-12 max-w-lg mx-auto">
        <ErrorAlert
          title="Booking Not Found"
          message="Your booking session may have expired or was cancelled."
          onRetry={() => navigate('/events')}
        />
      </div>
    );
  }

  const handleSelectProvider = (provider: ProviderEnum) => {
    sessionStorage.setItem(SESSION_KEYS.PAYMENT_PROVIDER, provider);

    initiatePaymentMutation.mutate(
      {
        bookingId: booking.id,
        data: { provider },
      },
      {
        onSuccess: (res) => {
          if (res.payment_url) {
            window.location.href = res.payment_url;
          } else {
            // Fallback for mock/direct verification redirect
            navigate(`/payment/callback?booking_id=${booking.id}&provider=${provider}`);
          }
        },
      }
    );
  };

  return (
    <div className="container-app py-10 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-500">Review your ticket reservation and initiate payment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-6">
          <BookingSummary
            eventTitle={booking.event_title}
            eventStartDatetime={booking.event_start_datetime}
            eventVenue={booking.event_venue}
            items={booking.items}
            totalAmount={booking.total_amount}
          />
        </div>

        <div className="md:col-span-6 space-y-6">
          <PaymentPanel
            onSelectProvider={handleSelectProvider}
            isLoading={initiatePaymentMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};
