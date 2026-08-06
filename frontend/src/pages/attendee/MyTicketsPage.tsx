import React, { useState } from 'react';
import { useMyTickets } from '../../hooks/useBookings';
import { TicketPass } from '../../components/booking/TicketPass';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatDateTime } from '../../lib/formatters';

export const MyTicketsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: ticketsData, isLoading, error, refetch } = useMyTickets(page);

  const tickets = ticketsData?.results || [];
  const totalCount = ticketsData?.count || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 space-y-2">
        <p className="font-semibold text-sm">Failed to load tickets.</p>
        <button onClick={() => refetch()} className="text-xs underline font-bold">
          Try again
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No Tickets Issued"
        description="Book tickets for upcoming events to view your digital passes and QR codes here."
        actionLabel="Explore Events"
        onAction={() => (window.location.href = '/events')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Tickets & Passes</h1>
        <p className="text-xs text-slate-500">Present these QR passes at the venue door for check-in</p>
      </div>

      <div className="space-y-6">
        {tickets.map((ticket) => (
          <TicketPass
            key={ticket.id}
            ticket={ticket}
            eventDate={formatDateTime(ticket.created_at)}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalCount={totalCount}
        pageSize={10}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
