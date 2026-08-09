import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePublicEvents, usePublicCategories } from '../../hooks/useEvents';
import { EventGrid } from '../../components/event/EventGrid';
import { EventFilterBar } from '../../components/event/EventFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { EventFilterParams } from '../../types/event.types';

export const EventListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const cityParam = searchParams.get('city') || '';

  const [filters, setFilters] = useState<EventFilterParams>({
    page: 1,
    q: qParam,
    category: categoryParam,
    city: cityParam,
  });

  const { data: categories = [] } = usePublicCategories();
  const { data: eventsData, isLoading, error, refetch } = usePublicEvents(filters);

  // Sync URL search params with state when navigation occurs
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      q: qParam,
      category: categoryParam,
      city: cityParam,
      page: 1,
    }));
  }, [qParam, categoryParam, cityParam]);

  const events = eventsData?.results || [];
  const totalCount = eventsData?.count || 0;
  const currentPage = filters.page || 1;

  const handleFilterChange = (newFilters: { q?: string; category?: string; city?: string }) => {
    const updatedParams: Record<string, string> = {};
    if (newFilters.q) updatedParams.q = newFilters.q;
    if (newFilters.category) updatedParams.category = newFilters.category;
    if (newFilters.city) updatedParams.city = newFilters.city;
    setSearchParams(updatedParams);

    setFilters({
      page: 1,
      q: newFilters.q || '',
      category: newFilters.category || '',
      city: newFilters.city || '',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Header Title Logic
  const activeCategoryObj = categories.find((c) => c.slug === filters.category);

  return (
    <div className="container-app py-12 space-y-8 min-h-screen text-slate-900">
      {/* Dynamic Heading Above Search */}
      <div className="space-y-2">
        {filters.q ? (
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-karyakram-purple-800 font-heading tracking-tight">
              Search Results for <span className="text-karyakram-purple-600 font-black">"{filters.q}"</span>
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Showing matching events, venues, and concerts across Nepal ({totalCount} found)
            </p>
          </div>
        ) : activeCategoryObj ? (
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-karyakram-purple-800 font-heading tracking-tight">
              <span className="text-karyakram-purple-600 font-black">{activeCategoryObj.name}</span> Events
            </h1>
            <p className="text-sm text-slate-600 font-medium">Showing top events in {activeCategoryObj.name}</p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-karyakram-purple-800 font-heading tracking-tight">
              Explore <span className="text-karyakram-purple-600 font-black">Events</span>
            </h1>
            <p className="text-sm text-slate-600 font-medium">Discover and book verified live events across Nepal</p>
          </div>
        )}
      </div>

      <EventFilterBar
        categories={categories}
        initialQ={filters.q}
        initialCategory={filters.category}
        initialCity={filters.city}
        onFilterChange={handleFilterChange}
      />

      {error ? (
        <div className="p-6 bg-karyakram-red-50 border border-karyakram-red-200 rounded-2xl text-center text-karyakram-red-800 shadow-2xs">
          <p className="font-semibold text-sm">Failed to load events.</p>
          <button onClick={() => refetch()} className="text-xs underline font-bold mt-2 hover:text-karyakram-red-900 cursor-pointer">
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
