import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Send, Trash2, Users } from 'lucide-react';
import { useOrganizerEvents, useSubmitEvent } from '../../hooks/useEvents';
import { eventService } from '../../services/event.service';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatDateTime } from '../../lib/formatters';
import { OrganizerEventList } from '../../types/event.types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export const OrganizerEventsPage: React.FC = () => {
  const { isApproved } = useAuth();
  const toast = useToast();
  const { data: events = [], isLoading, refetch } = useOrganizerEvents();
  const submitMutation = useSubmitEvent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this draft event?')) {
      try {
        await eventService.deleteOrganizerEvent(id);
        toast.success('Event deleted.');
        refetch();
      } catch {
        toast.error('Failed to delete event.');
      }
    }
  };

  const columns: Column<OrganizerEventList>[] = [
    {
      header: 'Event Title',
      accessor: (row) => (
        <div className="space-y-0.5 max-w-[200px]">
          <span className="font-bold text-slate-900 truncate block">{row.title}</span>
          <span className="text-xs text-slate-400 truncate block">{row.category?.name}</span>
        </div>
      ),
    },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Visibility', accessor: (row) => <span className="text-xs font-semibold uppercase">{row.visibility}</span> },
    { header: 'Date & Time', accessor: (row) => formatDateTime(row.start_datetime) },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {/* Edit (only if DRAFT or REJECTED) */}
          {(row.status === 'DRAFT' || row.status === 'REJECTED') && (
            <Link to={`/organizer/events/${row.id}/edit`}>
              <button title="Edit Event" className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Edit className="w-4 h-4" />
              </button>
            </Link>
          )}

          {/* Submit for review (only if DRAFT or REJECTED) */}
          {(row.status === 'DRAFT' || row.status === 'REJECTED') && (
            <button
              title="Submit for Admin Review"
              disabled={!isApproved || submitMutation.isPending}
              onClick={() => submitMutation.mutate(row.id)}
              className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          )}

          {/* Attendees link */}
          <Link to={`/organizer/events/${row.id}/attendees`}>
            <button title="View Attendees" className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Users className="w-4 h-4" />
            </button>
          </Link>

          {/* Delete (only DRAFT/REJECTED) */}
          {(row.status === 'DRAFT' || row.status === 'REJECTED') && (
            <button
              title="Delete Event"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Events</h1>
          <p className="text-xs text-slate-500">Manage drafts, review submissions, and published events</p>
        </div>
        <Link to="/organizer/events/new">
          <Button disabled={!isApproved} className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Create New Event
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(row) => row.id}
        emptyText="No events created yet."
      />
    </div>
  );
};
