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
    <div className="container-app py-8 space-y-8 min-h-screen text-slate-100">
      {/* 1. Top Banner Container (Below Nav) */}
      <div className="w-full h-72 sm:h-96 lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl relative bg-slate-900 border border-slate-800">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 relative flex items-center justify-center p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/25 via-purple-500/10 to-transparent" />
            <div className="relative z-10 space-y-2">
              <span className="text-4xl sm:text-6xl font-black text-white font-heading tracking-tight drop-shadow-md">
                {event.title}
              </span>
              {event.organizer_name && (
                <p className="text-sm sm:text-base text-indigo-300 font-medium">Organized by {event.organizer_name}</p>
              )}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
      </div>

      {/* 2. Title & Metadata Section (Below Banner) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-4 py-1.5 text-xs font-extrabold rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30 font-heading uppercase tracking-wider">
            {event.category?.name || 'General Event'}
          </span>
          <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            📍 {event.city}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight leading-tight">
          {event.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed font-sans font-medium">
          {event.short_description}
        </p>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800 text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">{formatDate(event.start_datetime)}</p>
              <p className="text-xs text-slate-400">{formatTime(event.start_datetime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">{event.venue}</p>
              <p className="text-xs text-slate-400">{event.address}, {event.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Organized by</p>
              <p className="text-xs text-slate-400">{event.organizer_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Overview & Ticket Purchase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Full Description & Terms */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white font-heading">About The Event</h2>
            <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {event.description}
            </div>
          </div>

          {event.terms_and_conditions && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
              <h3 className="text-base font-bold text-white font-heading">Terms & Conditions</h3>
              <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed font-sans">
                {event.terms_and_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Purchase Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 sticky top-24 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-extrabold text-white font-heading">Select Tickets</h3>
            </div>

            <TicketSelector
              tiers={event.ticket_tiers}
              selectedTiers={selectedTiers}
              onChange={handleQuantityChange}
            />

            {/* Total & Checkout Action */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Total ({totalSelectedTickets} tickets)</p>
                  <p className="text-3xl font-black text-emerald-400 font-heading">NPR {totalCost.toLocaleString()}</p>
                </div>

                <Button
                  size="lg"
                  disabled={totalSelectedTickets === 0}
                  isLoading={createBookingMutation.isPending}
                  onClick={handleBookNow}
                  className="px-8 py-4 text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-xl shadow-indigo-500/30 border-0 rounded-2xl"
                >
                  Book Now
                </Button>
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center font-medium">
                  You'll be asked to log in or register before completing checkout.
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant eSewa payment & QR pass delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
