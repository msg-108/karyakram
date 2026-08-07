import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Building, ShieldCheck, Ticket } from 'lucide-react';
import { usePublicEvent } from '../../hooks/useEvents';
import { useCreateBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatTime } from '../../lib/formatters';
import { TicketSelector } from '../../components/event/TicketSelector';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { bookingService } from '../../services/booking.service';
import { submitEsewaForm } from '../../lib/payment';
import { SESSION_KEYS } from '../../config/constants';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: event, isLoading, error } = usePublicEvent(slug || '');
  const createBookingMutation = useCreateBooking();

  const [selectedTiers, setSelectedTiers] = useState<Record<number, number>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container-app py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-sm text-slate-500">The event you requested is unavailable or has been unlisted.</p>
        <Button onClick={() => navigate('/events')}>Back to All Events</Button>
      </div>
    );
  }

  const handleQuantityChange = (tierId: number, qty: number) => {
    setSelectedTiers((prev) => ({
      ...prev,
      [tierId]: qty,
    }));
  };

  const selectedItemsList = Object.entries(selectedTiers)
    .filter(([_, qty]) => qty > 0)
    .map(([tierId, qty]) => ({
      ticket_tier: parseInt(tierId),
      quantity: qty,
    }));

  const totalSelectedTickets = selectedItemsList.reduce((acc, item) => acc + item.quantity, 0);

  const totalCost = selectedItemsList.reduce((acc, item) => {
    const tier = event.ticket_tiers.find((t) => t.id === item.ticket_tier);
    return acc + (tier ? parseFloat(tier.price) * item.quantity : 0);
  }, 0);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${slug}` } } });
      return;
    }

    if (selectedItemsList.length === 0) return;

    createBookingMutation.mutate(
      {
        event: event.id,
        items: selectedItemsList,
      },
      {
        onSuccess: (booking) => {
          sessionStorage.setItem(SESSION_KEYS.PENDING_BOOKING_ID, String(booking.id));
          navigate('/checkout');
        },
      }
    );
  };

  return (
    <div className="container-app py-8 space-y-8 min-h-screen text-slate-900">
      {/* 1. Top Banner Container */}
      <div className="w-full h-[400px] sm:h-[520px] lg:h-[600px] rounded-3xl overflow-hidden shadow-xl relative bg-karyakram-purple-600 border border-karyakram-purple-800">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-karyakram-purple-600 via-karyakram-purple-800 to-karyakram-purple-900 relative flex items-center justify-center p-8 text-center">
            <div className="relative z-10 space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight drop-shadow-md">
                {event.title}
              </span>
              {event.organizer_name && (
                <p className="text-sm sm:text-base text-karyakram-purple-200 font-medium">Organized by {event.organizer_name}</p>
              )}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />
      </div>

      {/* 2. Title & Metadata Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3.5 py-1 text-xs font-bold rounded-full badge-purple">
            {event.category?.name || 'General Event'}
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            📍 {event.city}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-karyakram-purple-900 font-heading tracking-tight leading-snug">
          {event.title}
        </h1>

        {event.short_description && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-4xl leading-relaxed font-sans font-medium">
            {event.short_description}
          </p>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-karyakram-purple-50 border border-karyakram-purple-200/60 text-karyakram-purple-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{formatDate(event.start_datetime)}</p>
              <p className="text-[11px] text-slate-500">{formatTime(event.start_datetime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-karyakram-purple-50 border border-karyakram-purple-200/60 text-karyakram-purple-800 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{event.venue}</p>
              <p className="text-[11px] text-slate-500">{event.address}, {event.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-karyakram-purple-50 border border-karyakram-purple-200/60 text-karyakram-purple-800 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Organized by</p>
              <p className="text-[11px] text-slate-500">{event.organizer_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Overview & Ticket Purchase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Full Description & Terms */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-black text-karyakram-purple-900 font-heading">About The Event</h2>
            <div className="prose max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {event.description}
            </div>
          </div>

          {event.terms_and_conditions && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl shadow-slate-200/50">
              <h3 className="text-base font-black text-karyakram-purple-900 font-heading">Terms & Conditions</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-sans">
                {event.terms_and_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Purchase Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 sticky top-24 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-karyakram-purple-50 text-karyakram-purple-800 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-black text-karyakram-purple-900 font-heading">Select Tickets</h3>
            </div>

            <TicketSelector
              tiers={event.ticket_tiers}
              selectedTiers={selectedTiers}
              onChange={handleQuantityChange}
            />

            {/* Total & Checkout Action */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Total ({totalSelectedTickets} tickets)</p>
                  <p className="text-2xl sm:text-3xl font-black text-karyakram-purple-900 font-heading">NPR {totalCost.toLocaleString()}</p>
                </div>

                <Button
                  size="lg"
                  disabled={totalSelectedTickets === 0}
                  isLoading={createBookingMutation.isPending}
                  onClick={handleBookNow}
                  className="px-6 py-4 text-sm sm:text-base font-extrabold bg-karyakram-gold-600 hover:bg-karyakram-gold-800 text-karyakram-purple-900 hover:text-white shadow-md shadow-karyakram-gold-600/25 border-0 rounded-2xl cursor-pointer"
                >
                  Proceed to Checkout →
                </Button>
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-karyakram-gold-800 bg-karyakram-gold-50 p-3 rounded-xl border border-karyakram-gold-200 text-center font-semibold">
                  You'll be asked to log in or register before completing checkout.
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-karyakram-purple-600" />
                <span>Instant eSewa payment & QR pass delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
