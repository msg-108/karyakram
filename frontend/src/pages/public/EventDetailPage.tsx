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
    <div className="relative min-h-screen pb-24 overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Full-Bleed Cinematic Hero Banner (Movie Style Background) */}
      <div className="absolute top-0 left-0 right-0 h-[550px] sm:h-[650px] lg:h-[720px] w-full overflow-hidden pointer-events-none z-0">
        {event.banner ? (
          <img
            src={event.banner}
            alt={event.title}
            className="w-full h-full object-cover object-center scale-105 blur-[1px] opacity-75"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/30 via-purple-500/15 to-transparent" />
          </div>
        )}

        {/* Multi-Layered Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* 2. Overlapping Hero Header Content (Cinematic Title & Meta Strip) */}
      <div className="container-app relative z-10 pt-20 sm:pt-28 lg:pt-36">
        <div className="max-w-4xl space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 text-xs font-extrabold rounded-full bg-indigo-600/90 text-white border border-indigo-400/40 shadow-lg shadow-indigo-600/30 backdrop-blur-md font-heading uppercase tracking-wider">
              {event.category?.name || 'Live Event'}
            </span>
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-slate-900/80 text-slate-200 border border-slate-700/80 backdrop-blur-md">
              📍 {event.city}
            </span>
          </div>

          {/* Cinematic Large Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white font-heading tracking-tight leading-[1.05] drop-shadow-2xl">
            {event.title}
          </h1>

          <p className="text-base sm:text-xl text-slate-200/90 max-w-3xl leading-relaxed font-sans font-medium drop-shadow-md">
            {event.short_description}
          </p>

          {/* Quick Info Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-200">
            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800">
              <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="font-bold text-white">{formatDate(event.start_datetime)}</p>
                <p className="text-[11px] text-slate-400">{formatTime(event.start_datetime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800">
              <MapPin className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="font-bold text-white">{event.venue}</p>
                <p className="text-[11px] text-slate-400">{event.address}, {event.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800">
              <Building className="w-5 h-5 text-pink-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Organized by</p>
                <p className="text-[11px] text-slate-400">{event.organizer_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Overlapping Content & Ticket Purchasing Grid */}
      <div className="container-app relative z-10 pt-12 sm:pt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Event Overview */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-2xl font-extrabold text-white font-heading">About The Event</h2>
            <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {event.description}
            </div>
          </div>

          {event.terms_and_conditions && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-3">
              <h3 className="text-base font-bold text-white font-heading">Terms & Conditions</h3>
              <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed font-sans">
                {event.terms_and_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Purchase Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 sticky top-24 shadow-2xl backdrop-blur-xl">
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
