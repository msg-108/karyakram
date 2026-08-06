import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, ShieldCheck, Zap, Search, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventGrid } from '../../components/event/EventGrid';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: eventsData, isLoading: eventsLoading } = usePublicEvents({ page: 1 });
  const { data: categories = [] } = usePublicCategories();

  const events = eventsData?.results || [];
  const trendingEvents = events.slice(0, 5); // Top 5 featured sliding events

  // Auto slide every 5.5 seconds
  useEffect(() => {
    if (trendingEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [trendingEvents.length]);

  const activeEvent = trendingEvents[currentSlide] || events[0];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + trendingEvents.length) % trendingEvents.length);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-24 overflow-hidden bg-slate-950 text-slate-100 min-h-screen">
      {/* 1. FMovies Style Sliding Hero Banner Section */}
      <section className="relative w-full h-[540px] sm:h-[640px] lg:h-[700px] overflow-hidden border-b border-slate-800">
        {/* Sliding Background Banner */}
        {trendingEvents.length > 0 ? (
          trendingEvents.map((evt, idx) => (
            <div
              key={evt.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {evt.banner ? (
                <img
                  src={evt.banner}
                  alt={evt.title}
                  className="w-full h-full object-cover object-center scale-105 blur-[1px] opacity-75"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/30 via-purple-500/15 to-transparent" />
                </div>
              )}

              {/* Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

              {/* Slide Content */}
              <div className="container-app relative z-20 h-full flex flex-col justify-end pb-12 sm:pb-16 space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 text-xs font-black rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 uppercase tracking-wider font-heading shadow-md">
                    🔥 TRENDING SLIDE #{idx + 1}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-900/80 border border-slate-700 text-indigo-300 backdrop-blur-md">
                    LIVE TICKETS AVAILABLE
                  </span>
                  {evt.category && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-600/90 text-white border border-indigo-400/30 backdrop-blur-md">
                      {evt.category.name}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div className="space-y-3 max-w-3xl">
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white font-heading tracking-tight leading-[1.05] drop-shadow-2xl">
                    {evt.title}
                  </h1>
                  <p className="text-sm sm:text-lg text-slate-300 line-clamp-2 leading-relaxed max-w-2xl drop-shadow-md">
                    {evt.short_description}
                  </p>
                </div>

                {/* Location & Date Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    {new Date(evt.start_datetime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    {evt.venue}, {evt.city}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate(`/events/${evt.slug}`)}
                    className="px-8 py-3.5 text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-xl shadow-indigo-500/30 border-0 rounded-2xl flex items-center gap-2"
                  >
                    <Ticket className="w-5 h-5" /> Book Tickets Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate(`/events/${evt.slug}`)}
                    className="px-6 py-3.5 text-base font-bold bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white rounded-2xl backdrop-blur-md"
                  >
                    Event Details →
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}

        {/* Carousel Navigation Buttons & Indicators */}
        {trendingEvents.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-white hover:bg-indigo-600 transition-all backdrop-blur-md shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-white hover:bg-indigo-600 transition-all backdrop-blur-md shadow-xl cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pagination Indicators */}
            <div className="absolute bottom-6 right-6 sm:right-12 z-30 flex items-center gap-2">
              {trendingEvents.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === currentSlide ? 'w-8 bg-indigo-500' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. FMovies Centered Search Bar */}
      <section className="container-app max-w-3xl -mt-10 relative z-20">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center bg-slate-900/95 border-2 border-slate-700 focus-within:border-indigo-500 rounded-2xl shadow-2xl p-2 backdrop-blur-xl transition-all">
            <Search className="w-5 h-5 text-indigo-400 ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Search movies, concerts, tech summits, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-medium"
            />
            <Button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shrink-0"
            >
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* 3. Category Genre Rail */}
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

      {/* 4. Trending & Latest Events Catalogue */}
      <section className="container-app space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading flex items-center gap-2">
              🔥 Trending Live Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">Discover top rated concerts and conferences in Nepal</p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
              See All →
            </Button>
          </Link>
        </div>

        <EventGrid events={events} isLoading={eventsLoading} />
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
