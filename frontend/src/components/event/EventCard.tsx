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
  return (
    <Link to={`/events/${event.slug}`} className="block group">
      <div className="h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group-hover:border-indigo-500/60 group-hover:shadow-2xl group-hover:shadow-indigo-500/15 group-hover:-translate-y-1">
        {/* Banner Image / Fallback Container */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800/60">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-3xl font-black text-white font-heading tracking-tight drop-shadow-md">
                  {event.title}
                </span>
                {event.organizer_name && (
                  <p className="text-xs text-indigo-200/80 font-medium">by {event.organizer_name}</p>
                )}
              </div>
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />

          {/* Category Badge */}
          {event.category && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30 backdrop-blur-md">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Location Badge on Image */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[180px]">{event.city}</span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 font-heading leading-snug">
              {event.title}
            </h3>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {event.short_description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-slate-400 font-medium truncate">
                {event.venue}
              </span>
              {event.organizer_name && (
                <span className="text-[11px] text-slate-500 truncate">
                  by {event.organizer_name}
                </span>
              )}
            </div>

            <span className="shrink-0 font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all inline-flex items-center gap-1">
              View Tickets →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
