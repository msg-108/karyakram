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
      <div className="h-[430px] bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:border-indigo-500 group-hover:shadow-2xl group-hover:shadow-indigo-500/20 group-hover:-translate-y-1">
        {/* Banner Image Container (Main Priority - Expanded Height) */}
        <div className="relative h-64 w-full bg-slate-950 overflow-hidden border-b border-slate-800 shrink-0">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/25 via-purple-500/10 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-2xl font-black text-white font-heading tracking-tight drop-shadow-md">
                  {event.title}
                </span>
                {event.organizer_name && (
                  <p className="text-xs text-indigo-300 font-semibold">by {event.organizer_name}</p>
                )}
              </div>
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85" />

          {/* Category Badge */}
          {event.category && (
            <div className="absolute top-3 right-3 z-10">
              <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-md border border-white/20 ${getCategoryColor(event.category.slug)}`}>
                {event.category.name}
              </span>
            </div>
          )}

          {/* Location Badge on Image */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-slate-100 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[180px]">{event.city}</span>
          </div>
        </div>

        {/* Content Details (Short Description Removed, Clean Uniform Padding) */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 font-heading leading-snug">
              {event.title}
            </h3>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-slate-200 font-bold truncate">
                {event.venue}
              </span>
              {event.organizer_name && (
                <span className="text-[11px] text-slate-400 truncate">
                  by {event.organizer_name}
                </span>
              )}
            </div>

            <span className="shrink-0 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 font-bold text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all inline-flex items-center gap-1">
              Book →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
