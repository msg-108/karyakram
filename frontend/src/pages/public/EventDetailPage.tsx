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
    <div className="space-y-8 pb-16">
      {/* Banner Header */}
      <div className="relative bg-slate-900 text-white">
        <div className="aspect-[21/9] max-h-96 w-full overflow-hidden opacity-60">
          {event.banner ? (
            <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900 flex items-center justify-center font-black text-4xl">
              {event.title[0]}
            </div>
          )}
        </div>

        <div className="container-app relative z-10 -mt-24 sm:-mt-32 pb-8">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{event.category?.name || 'General'}</Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{event.title}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">{formatDate(event.start_datetime)}</p>
                  <p className="text-xs text-slate-500">{formatTime(event.start_datetime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">{event.venue}</p>
                  <p className="text-xs text-slate-500">{event.address}, {event.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Organized by</p>
                  <p className="text-xs text-slate-500">{event.organizer_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content & Ticket Purchase Grid */}
      <div className="container-app grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Info Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </CardContent>
          </Card>

          {event.terms_and_conditions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                {event.terms_and_conditions}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Ticket Purchasing Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                Select Tickets
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <TicketSelector
                tiers={event.ticket_tiers}
                selectedTiers={selectedTiers}
                onChange={handleQuantityChange}
              />

              {/* Total & Checkout Button */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Total ({totalSelectedTickets} tickets)</p>
                    <p className="text-2xl font-black text-indigo-600">NPR {totalCost.toLocaleString()}</p>
                  </div>

                  <Button
                    size="lg"
                    disabled={totalSelectedTickets === 0}
                    isLoading={createBookingMutation.isPending}
                    onClick={handleBookNow}
                    className="px-6"
                  >
                    Book Now
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
                    You'll be asked to log in or register before completing checkout.
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Atomic quantity reservation prevents overselling</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
