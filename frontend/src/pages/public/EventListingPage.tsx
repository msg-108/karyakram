import React, { useState } from 'react';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventGrid } from '../../components/event/EventGrid';
import { EventFilterBar } from '../../components/event/EventFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { EventFilterParams } from '../../types/event.types';

export const EventListingPage: React.FC = () => {
  const [filters, setFilters] = useState<EventFilterParams>({ page: 1 });

  const { data: categories = [] } = usePublicCategories();
  const { data: eventsData, isLoading, error, refetch } = usePublicEvents(filters);

  const events = eventsData?.results || [];
  const totalCount = eventsData?.count || 0;
  const currentPage = filters.page || 1;

  const handleFilterChange = (newFilters: Partial<EventFilterParams>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-app py-12 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
          Explore <span className="text-gradient">Events</span>
        </h1>
        <p className="text-sm text-slate-400">Discover and book verified live events across Nepal</p>
      </div>

      <EventFilterBar categories={categories} onFilterChange={handleFilterChange} />

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700">
          <p className="font-semibold text-sm">Failed to load events.</p>
          <button onClick={() => refetch()} className="text-xs underline font-bold mt-2">
            Try again
          </button>
        </div>
      ) : (
        <>
          <EventGrid events={events} isLoading={isLoading} />
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={10}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};
