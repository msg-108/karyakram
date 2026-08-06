import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, ShieldCheck, Zap } from 'lucide-react';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventGrid } from '../../components/event/EventGrid';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: eventsData, isLoading: eventsLoading } = usePublicEvents({ page: 1 });
  const { data: categories = [] } = usePublicCategories();

  const events = eventsData?.results || [];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="container-app relative z-10 text-center space-y-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Discover & Book Events Across Nepal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Unforgettable Experiences Begin Here.
          </h1>

          <p className="text-base sm:text-lg text-indigo-100/80 max-w-xl mx-auto leading-relaxed">
            From tech summits in Kathmandu to music festivals in Pokhara — get your tickets instantly with instant eSewa & Khalti checkout.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/events')} className="px-8 text-base">
              Browse Events
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/register/organizer')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base"
            >
              Host an Event
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      {categories.length > 0 && (
        <section className="container-app">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Explore Categories</h2>
            <Link to="/events" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/events?category=${cat.slug}`)}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-center space-y-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="block text-xs font-bold text-slate-800 truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured / Upcoming Events */}
      <section className="container-app space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
            <p className="text-xs text-slate-500">Popular upcoming events happening soon</p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm">
              See All Events
            </Button>
          </Link>
        </div>

        <EventGrid events={events} isLoading={eventsLoading} />
      </section>

      {/* Features Callout */}
      <section className="container-app">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Instant E-Tickets</h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Get signed QR codes immediately after payment confirmation directly to your account.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Secure Local Payments</h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Pay via Khalti or eSewa with real-time verification and zero risk of overselling.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Organizer Suite</h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Powerful dashboard with real-time check-in scanning, tier management, and revenue analytics.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
