import React, { useState } from 'react';
import { usePendingEvents, useApproveOrRejectEvent, usePublishEvent } from '../../hooks/useAdmin';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { AdminEventReview } from '../../types/dashboard.types';
import { formatDateTime } from '../../lib/formatters';
import { CheckCircle2, XCircle, Globe } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const PendingEventsPage: React.FC = () => {
  const { data: events = [], isLoading } = usePendingEvents();
  const actionMutation = useApproveOrRejectEvent();
  const publishMutation = usePublishEvent();

  const [selectedEvent, setSelectedEvent] = useState<AdminEventReview | null>(null);
  const [reason, setReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleAction = (action: 'approve' | 'reject') => {
    if (!selectedEvent) return;

    actionMutation.mutate(
      {
        eventId: selectedEvent.id,
        data: { action, reason },
      },
      {
        onSuccess: () => {
          setSelectedEvent(null);
          setReason('');
        },
      }
    );
  };

  const handlePublish = (eventId: number) => {
    publishMutation.mutate(eventId, {
      onSuccess: () => setSelectedEvent(null),
    });
  };

  const columns: Column<AdminEventReview>[] = [
    {
      header: 'Event Title',
      accessor: (row) => (
        <div className="space-y-0.5 max-w-[220px]">
          <span className="font-bold text-slate-900 block truncate">{row.title}</span>
          <span className="text-xs text-slate-900 font-bold block">{row.category?.name}</span>
        </div>
      ),
    },
    { header: 'Organizer', accessor: (row) => row.organizer_name },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Start Time', accessor: (row) => formatDateTime(row.start_datetime) },
    {
      header: 'Action',
      accessor: (row) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedEvent(row)}>
          Review Event
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Pending Events Queue</h1>
        <p className="text-xs text-slate-600 font-medium">Review submitted organizer events, approve content, and publish live</p>
      </div>

      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(row) => row.id}
        emptyText="No events currently waiting in admin review queue."
      />

      {/* Review Modal */}
      {selectedEvent && (
        <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title="Review Event Submission">
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#F3F4F6] border border-slate-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{selectedEvent.title}</h3>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <p className="text-slate-700 font-medium">Organized by {selectedEvent.organizer_name}</p>
              <p className="text-slate-900 font-bold">{formatDateTime(selectedEvent.start_datetime)}</p>
            </div>

            <FormField
              as="textarea"
              rows={2}
              label="Rejection Reason (Required if rejecting)"
              placeholder="e.g. Terms violate platform guidelines"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              {selectedEvent.status === 'SUBMITTED' && (
                <>
                  <Button
                    variant="danger"
                    className="flex-1 gap-1"
                    isLoading={actionMutation.isPending}
                    onClick={() => handleAction('reject')}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Event
                  </Button>

                  <Button
                    className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                    isLoading={actionMutation.isPending}
                    onClick={() => handleAction('approve')}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Event
                  </Button>
                </>
              )}

              {selectedEvent.status === 'APPROVED' && (
                <Button
                  className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  isLoading={publishMutation.isPending}
                  onClick={() => handlePublish(selectedEvent.id)}
                >
                  <Globe className="w-4 h-4" />
                  Publish Live to Public Homepage
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
