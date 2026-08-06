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
      <Card className="h-full flex flex-col hover:-translate-y-1 transition-all duration-200">
        {/* Banner Image */}
        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-2xl">
              {event.title[0]}
            </div>
          )}

          {/* Category Badge */}
          {event.category && (
            <div className="absolute top-3 right-3">
              <Badge variant="indigo" className="shadow-xs backdrop-blur-md bg-white/90">
                {event.category.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {event.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {event.short_description}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>

            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              View Details →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
