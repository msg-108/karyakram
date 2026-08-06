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
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-10 w-[350px] h-[350px] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container-app relative z-10 text-center space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Discover & Book Events Across Nepal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] font-heading">
            Unforgettable <span className="text-gradient">Experiences</span> Begin Here.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            From live music festivals in Pokhara to tech summits in Kathmandu — book verified tickets instantly with eSewa integration.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate('/events')}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/25 border-0 rounded-2xl"
            >
              Explore Events
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/register/organizer')}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white rounded-2xl"
            >
              Host an Event
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="container-app space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                Explore Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">Find events tailored to your interests</p>
            </div>
            <Link to="/events" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/events?category=${cat.slug}`)}
                className="p-5 glass-card glass-card-hover rounded-2xl text-center space-y-3 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-white truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured / Upcoming Events */}
      <section className="container-app space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Upcoming Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">Handpicked upcoming events happening across Nepal</p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
              See All Events
            </Button>
          </Link>
        </div>

        <EventGrid events={events} isLoading={eventsLoading} />
      </section>

      {/* Features Callout */}
      <section className="container-app">
        <div className="relative glass-panel rounded-3xl p-8 sm:p-14 overflow-hidden border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Instant QR Passes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive signed QR code ticket passes directly in your portal after payment verification.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">eSewa Payments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay securely via eSewa with automated real-time payment status reconciliation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Organizer Suite</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access attendee QR scanning, multi-tier ticket builders, and real-time sales dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
