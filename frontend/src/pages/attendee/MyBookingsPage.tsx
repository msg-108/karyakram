import React from 'react';
import { useUserBookings, useCancelBooking } from '../../hooks/useBookings';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const MyBookingsPage: React.FC = () => {
  const { data: bookings = [], isLoading, error, refetch } = useUserBookings();
  const cancelBookingMutation = useCancelBooking();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 space-y-2">
        <p className="font-semibold text-sm">Failed to load booking history.</p>
        <button onClick={() => refetch()} className="text-xs underline font-bold">
          Try again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No Bookings Yet"
        description="Browse available events and book your tickets today!"
        actionLabel="Explore Events"
        onAction={() => (window.location.href = '/events')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Booking History</h1>
        <p className="text-xs text-slate-500">Track your pending, confirmed, and cancelled orders</p>
      </div>

      <div className="space-y-4">
        {bookings.map((b) => (
          <Card key={b.id} className="hover:border-slate-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{b.event_title}</CardTitle>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-indigo-600 font-semibold">
                  {formatDateTime(b.event_start_datetime)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Order Total</span>
                <p className="text-base font-black text-slate-900">{formatCurrency(b.total_amount)}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 divide-y divide-slate-200/60">
                {b.items.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {item.ticket_tier_name} x{item.quantity}
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Booked on {formatDateTime(b.created_at)}</span>

                {b.status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    isLoading={cancelBookingMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this booking? Stock will be restored.')) {
                        cancelBookingMutation.mutate(b.id);
                      }
                    }}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
