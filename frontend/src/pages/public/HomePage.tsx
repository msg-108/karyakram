import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, ShieldCheck, Zap, Sparkles, Flame, ThumbsUp } from 'lucide-react';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventGrid } from '../../components/event/EventGrid';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: eventsData, isLoading: eventsLoading } = usePublicEvents({ page: 1 });
  const { data: categories = [] } = usePublicCategories();

  const allEvents = eventsData?.results || [];

  // Trending Logic: Events sorted by start date / upcoming proximity (Top 4)
  const trendingEvents = [...allEvents]
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 4);

  // Recommended Logic: Events with available tickets / remaining capacity or category diversity (Next 4)
  const recommendedEvents = allEvents.length > 4 ? allEvents.slice(4, 8) : allEvents.slice(0, 4);

  return (
    <div className="space-y-16 pb-24 overflow-hidden bg-slate-950 text-slate-100 min-h-screen">
      {/* 1. Short Intro to Karyakram Hero Section */}
      <section className="relative pt-14 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container-app relative z-10 text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Nepal's Premier Event & Ticketing Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white font-heading tracking-tight leading-tight">
            Welcome to <span className="text-gradient">Karyakram</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            Discover live music concerts, tech summits, workshops, and food festivals across Nepal. Book verified tickets instantly with atomic QR passes and eSewa integration.
          </p>

          <div className="pt-2 flex flex-wrap justify-center items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/events')}
              className="px-8 py-3.5 text-sm sm:text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-xl shadow-indigo-500/25 border-0 rounded-2xl"
            >
              Explore All Events →
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/register/organizer')}
              className="px-6 py-3.5 text-sm sm:text-base font-bold bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white rounded-2xl"
            >
              Host an Event
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Category Genre Rail */}
      {categories.length > 0 && (
        <section className="container-app space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Browse by Category
            </h2>
            <Link to="/events" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              View All Categories →
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/events?category=${cat.slug}`)}
                className="px-5 py-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all shrink-0 flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. 🔥 Trending Events Section */}
      <section className="container-app space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-500" /> Trending Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">Handpicked upcoming events with highest interest across Nepal</p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
              View All →
            </Button>
          </Link>
        </div>

        <EventGrid events={trendingEvents} isLoading={eventsLoading} />
      </section>

      {/* 4. ✨ Recommended Events Section */}
      <section className="container-app space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading flex items-center gap-2">
              <ThumbsUp className="w-6 h-6 text-indigo-400" /> Recommended For You
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">Specially curated events based on top categories and venues</p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
              Explore More →
            </Button>
          </Link>
        </div>

        <EventGrid events={recommendedEvents} isLoading={eventsLoading} />
      </section>

      {/* 5. Features Callout */}
      <section className="container-app pt-6">
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Instant QR Ticket Passes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive signed QR code ticket passes directly in your portal after payment verification.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">eSewa Instant Payments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay securely via eSewa with automated real-time payment status reconciliation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Organizer Dashboard</h3>
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
