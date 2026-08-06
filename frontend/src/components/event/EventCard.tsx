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
      <div className="h-full glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Banner Image */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white font-black text-3xl font-heading">
              <span className="text-gradient">{event.title[0]}</span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

          {/* Category Badge */}
          {event.category && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Location Badge on Image */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[180px]">{event.city}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 font-heading leading-snug">
              {event.title}
            </h3>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {event.short_description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium truncate max-w-[60%]">
              {event.venue}
            </span>

            <span className="font-bold text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View Tickets →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
