import React from 'react';
import { PublicEventList } from '../../types/event.types';
import { EventCard } from './EventCard';
import { EventCardSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

export interface EventGridProps {
  events?: PublicEventList[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const EventGrid: React.FC<EventGridProps> = ({
  events = [],
  isLoading = false,
  emptyTitle = 'No events found',
  emptyDescription = 'Try adjusting your search query or filters to find upcoming events.',
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
