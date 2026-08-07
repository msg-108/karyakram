import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { PublicEventList } from '../../types/event.types';
import { formatDate, formatTime } from '../../lib/formatters';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface EventCardProps {
  event: PublicEventList;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const getCategoryColor = (slug?: string) => {
    switch (slug) {
      case 'music-festivals':
        return 'bg-pink-600/90 text-white shadow-pink-600/30';
      case 'tech-startups':
        return 'bg-cyan-600/90 text-white shadow-cyan-600/30';
      case 'food-culinary':
        return 'bg-amber-500/90 text-slate-950 shadow-amber-500/30 font-black';
      case 'sports-outdoor':
        return 'bg-emerald-600/90 text-white shadow-emerald-600/30';
      default:
        return 'bg-indigo-600/90 text-white shadow-indigo-600/30';
    }
  };

  return (
    <Link to={`/events/${event.slug}`} className="block group h-full">
      <div className="h-[430px] bg-[#F3F4F6] border border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:border-karyakram-red-600 group-hover:shadow-xl group-hover:-translate-y-1">
        {/* Banner Image Container */}
        <div className="relative h-64 w-full bg-slate-200/60 overflow-hidden border-b border-slate-300 shrink-0">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-karyakram-red-50 via-slate-100 to-karyakram-gold-50 p-6 text-center overflow-hidden">
              <div className="relative z-10 space-y-1">
                <span className="text-2xl font-black text-slate-900 font-heading tracking-tight">
                  {event.title}
                </span>
                {event.organizer_name && (
                  <p className="text-xs text-slate-700 font-semibold">by {event.organizer_name}</p>
                )}
              </div>
            </div>
          )}

          {/* Category Badge - Uses 50-tint bg / 800-shade text rule */}
          {event.category && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-karyakram-red-50 text-karyakram-red-800 border border-karyakram-red-200 shadow-xs">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Location Badge on Image */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-karyakram-red-600 shrink-0" />
            <span className="truncate max-w-[180px]">{event.city}</span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-[#F3F4F6]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-karyakram-red-50 border border-karyakram-red-200 text-karyakram-red-800 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-karyakram-red-600" />
              <span>
                {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 group-hover:text-karyakram-red-600 transition-colors line-clamp-2 font-heading leading-snug">
              {event.title}
            </h3>
          </div>

          <div className="pt-3 border-t border-slate-300/70 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-slate-800 font-bold truncate">
                {event.venue}
              </span>
              {event.organizer_name && (
                <span className="text-[11px] text-slate-500 truncate">
                  by {event.organizer_name}
                </span>
              )}
            </div>

            {/* Primary CTA - Gold 600 Fill with Red 900 Text */}
            <span className="shrink-0 px-3.5 py-1.5 rounded-xl bg-karyakram-gold-600 hover:bg-karyakram-gold-800 font-extrabold text-karyakram-red-900 hover:text-white shadow-md shadow-karyakram-gold-600/20 group-hover:scale-105 transition-all inline-flex items-center gap-1">
              Book →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
