import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, ShieldCheck, Zap, Sparkles, Flame, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventCard } from '../../components/event/EventCard';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const trendingRowRef = useRef<HTMLDivElement>(null);
  const recommendedRowRef = useRef<HTMLDivElement>(null);

  const { data: eventsData, isLoading: eventsLoading } = usePublicEvents({ page: 1 });
  const { data: categories = [] } = usePublicCategories();

  const allEvents = eventsData?.results || [];

  // Trending Logic: Events sorted by start date / upcoming proximity
  const trendingEvents = [...allEvents].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  // Recommended Logic: Secondary selection or category diversity
  const recommendedEvents = allEvents.length > 3 ? allEvents.slice(2) : allEvents;

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 pb-24 overflow-hidden bg-[#FAFAFA] text-slate-900 min-h-screen">
      {/* 1. Short Intro to Karyakram Hero Section */}
      <section className="bg-karyakram-red-600 text-white py-14 sm:py-20 border-b border-karyakram-red-800">
        <div className="container-app max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-karyakram-gold-200 animate-pulse" />
            <span>Nepal's Premier Ticket Exchange & Event Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white leading-tight">
            Discover & Experience Unforgettable Events in Nepal
          </h1>

          <p className="text-base sm:text-lg text-karyakram-red-50 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            Discover live music concerts, tech summits, workshops, and food festivals across Nepal. Book verified tickets instantly with atomic QR passes and eSewa integration.
          </p>

          <div className="pt-2 flex flex-wrap justify-center items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/events')}
              className="px-8 py-3.5 text-sm sm:text-base font-bold shadow-md shadow-karyakram-gold-600/30 rounded-2xl cursor-pointer"
            >
              Explore All Events →
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/register/organizer')}
              className="px-6 py-3.5 text-sm sm:text-base font-bold rounded-2xl cursor-pointer border-white text-white hover:bg-karyakram-red-800 bg-karyakram-red-400"
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-karyakram-red-600" /> Browse by Category
            </h2>
            <Link to="/events" className="text-xs font-bold text-slate-900 hover:text-karyakram-red-600">
              View All Categories →
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/events?category=${cat.slug}`)}
                className="px-5 py-3 bg-[#F3F4F6] border border-slate-300 hover:border-karyakram-red-600 rounded-2xl text-xs font-bold text-slate-900 hover:text-karyakram-red-600 hover:bg-white transition-all shrink-0 flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-karyakram-red-600" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Events Section */}
      <section className="container-app space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading flex items-center gap-2">
              <Flame className="w-6 h-6 text-karyakram-red-600" /> Trending Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Handpicked upcoming events with highest interest across Nepal</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollRow(trendingRowRef, 'left')}
              aria-label="Previous Trending"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-karyakram-red-600 hover:bg-karyakram-red-50 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollRow(trendingRowRef, 'right')}
              aria-label="Next Trending"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-karyakram-purple-600 hover:bg-karyakram-purple-50 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link to="/events" className="hidden sm:inline-block ml-2">
              <Button variant="outline" size="sm" className="rounded-xl">
                See All →
              </Button>
            </Link>
          </div>
        </div>

        {/* Single Horizontal Sliding Row */}
        {eventsLoading ? (
          <div className="flex gap-6 overflow-hidden py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[340px] sm:w-[380px] lg:w-[420px] h-[430px] skeleton shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div ref={trendingRowRef} className="flex overflow-x-auto scroll-smooth gap-6 py-2 scrollbar-none">
            {trendingEvents.map((evt) => (
              <div key={evt.id} className="w-[340px] sm:w-[380px] lg:w-[420px] shrink-0">
                <EventCard event={evt} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Recommended Events Section */}
      <section className="container-app space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-karyakram-purple-800 font-heading flex items-center gap-2">
              <ThumbsUp className="w-6 h-6 text-karyakram-purple-600" /> Recommended For You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Specially curated events based on top categories and venues</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollRow(recommendedRowRef, 'left')}
              aria-label="Previous Recommended"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-karyakram-purple-600 hover:bg-karyakram-purple-50 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollRow(recommendedRowRef, 'right')}
              aria-label="Next Recommended"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-karyakram-purple-600 hover:bg-karyakram-purple-50 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link to="/events" className="hidden sm:inline-block ml-2">
              <Button variant="outline" size="sm" className="rounded-xl">
                Explore All →
              </Button>
            </Link>
          </div>
        </div>

        {/* Single Horizontal Sliding Row */}
        {eventsLoading ? (
          <div className="flex gap-6 overflow-hidden py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[340px] sm:w-[380px] lg:w-[420px] h-[430px] skeleton shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div ref={recommendedRowRef} className="flex overflow-x-auto scroll-smooth gap-6 py-2 scrollbar-none">
            {recommendedEvents.map((evt) => (
              <div key={evt.id} className="w-[340px] sm:w-[380px] lg:w-[420px] shrink-0">
                <EventCard event={evt} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Features Callout */}
      <section className="container-app pt-6">
        <div className="relative bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-xl shadow-slate-200/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-karyakram-purple-50 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-karyakram-purple-50 text-karyakram-purple-800 border border-karyakram-purple-200/60 flex items-center justify-center shadow-2xs">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Instant QR Ticket Passes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive signed QR code ticket passes directly in your portal after payment verification.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-karyakram-gold-50 text-karyakram-gold-800 border border-karyakram-gold-200/60 flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">eSewa Instant Payments</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay securely via eSewa with automated real-time payment status reconciliation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-karyakram-purple-50 text-karyakram-purple-800 border border-karyakram-purple-200/60 flex items-center justify-center shadow-2xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Organizer Dashboard</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access attendee QR scanning, multi-tier ticket builders, and real-time sales dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
