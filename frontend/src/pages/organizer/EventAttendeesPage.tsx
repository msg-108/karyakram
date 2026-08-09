import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventAttendees } from '../../hooks/useOrganizer';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AttendeeSummary } from '../../types/dashboard.types';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

export const EventAttendeesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : 0;

  const { data: attendees = [], isLoading } = useEventAttendees(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const columns: Column<AttendeeSummary>[] = [
    { header: 'Attendee Name', accessor: (row) => <span className="font-bold">{row.attendee_name}</span> },
    { header: 'Email Address', accessor: (row) => row.email },
    { header: 'Ticket Status', accessor: (row) => <StatusBadge status={row.ticket_status} /> },
    {
      header: 'Checked In',
      accessor: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {row.checked_in ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Checked In</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Not Checked In</span>
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Event Attendees</h1>
          <p className="text-xs text-slate-500">Registered ticket holders and check-in status</p>
        </div>
        <Link to="/organizer/events">
          <Button variant="outline" size="sm">
            Back to Events
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={attendees}
        keyExtractor={(row) => row.email + row.attendee_name}
        emptyText="No attendees registered for this event yet."
      />
    </div>
  );
};
